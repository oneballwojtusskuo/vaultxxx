import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PLATFORM_FEE_PCT = 10;

const InputSchema = z.object({
  productId: z.string().uuid(),
  referralUserId: z.string().uuid().optional().nullable(),
});

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Create a transaction for the authenticated buyer.
 * - Free products (price = 0): immediately marked `completed`, no revenue split.
 * - Paid products: created as `pending`. Completion requires a verified
 *   payment webhook (not yet integrated).
 *
 * Revenue split (paid products only, recorded at purchase time):
 *   platform_amount  = price * platform_fee_pct / 100        (fixed 10%)
 *   affiliate_amount = price * product.affiliate_commission_pct / 100
 *                      (only when a valid referral cookie was passed and
 *                       the referrer is neither the buyer nor the seller)
 *   seller_amount    = price - platform_amount - affiliate_amount
 */
export const purchaseProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, seller_id, price, currency, status, downloads_count, affiliate_commission_pct")
      .eq("id", data.productId)
      .maybeSingle();

    if (pErr || !product) throw new Response("Product not found", { status: 404 });
    if (product.status !== "published") throw new Response("Product not available", { status: 400 });
    if (product.seller_id === userId) throw new Response("Cannot purchase your own product", { status: 400 });

    // Reject duplicate completed purchases
    const { data: existing } = await supabaseAdmin
      .from("transactions")
      .select("id, status")
      .eq("product_id", product.id)
      .eq("buyer_id", userId)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle();
    if (existing) return { transactionId: existing.id, status: "completed" as const, alreadyOwned: true };

    const price = Number(product.price);
    const isFree = price === 0;
    const status = isFree ? "completed" : "pending";

    // Resolve & validate affiliate referrer
    let affiliateUserId: string | null = null;
    const affiliateCommissionPct = Math.max(
      0,
      Math.min(50, Number((product as any).affiliate_commission_pct ?? 0)),
    );
    if (
      !isFree &&
      affiliateCommissionPct > 0 &&
      data.referralUserId &&
      data.referralUserId !== userId &&
      data.referralUserId !== product.seller_id
    ) {
      const { data: refProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", data.referralUserId)
        .maybeSingle();
      if (refProfile) affiliateUserId = refProfile.id;
    }

    let platformAmount = 0;
    let affiliateAmount = 0;
    let sellerAmount = 0;
    let recordedAffiliatePct = 0;
    let recordedPlatformPct = 0;
    if (!isFree) {
      recordedPlatformPct = PLATFORM_FEE_PCT;
      recordedAffiliatePct = affiliateUserId ? affiliateCommissionPct : 0;
      platformAmount = round2((price * PLATFORM_FEE_PCT) / 100);
      affiliateAmount = affiliateUserId ? round2((price * affiliateCommissionPct) / 100) : 0;
      sellerAmount = round2(price - platformAmount - affiliateAmount);
    }

    const { data: tx, error: tErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        product_id: product.id,
        buyer_id: userId,
        seller_id: product.seller_id,
        amount: product.price,
        currency: product.currency,
        status,
        affiliate_user_id: affiliateUserId,
        affiliate_amount: affiliateAmount,
        seller_amount: sellerAmount,
        platform_amount: platformAmount,
        affiliate_commission_pct: recordedAffiliatePct,
        platform_fee_pct: recordedPlatformPct,
      } as any)
      .select("id, status")
      .single();
    if (tErr || !tx) throw new Response(tErr?.message ?? "Could not create transaction", { status: 500 });

    if (isFree) {
      await supabaseAdmin
        .from("products")
        .update({ downloads_count: (product.downloads_count ?? 0) + 1 })
        .eq("id", product.id);
    }

    return { transactionId: tx.id, status: tx.status, alreadyOwned: false };
  });
