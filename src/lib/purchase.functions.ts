import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  productId: z.string().uuid(),
  referralUserId: z.string().uuid().nullable().optional(),
  returnUrl: z.string().url().optional(),
  environment: z.enum(["sandbox", "live"]).optional(),
});

const PLATFORM_FEE_PCT = 10;

/**
 * Buyer purchase flow:
 * - Free products: mark completed immediately.
 * - Paid products: create a pending transaction, open a Stripe Embedded
 *   Checkout session (BLIK promoted as the first payment method for PLN),
 *   and let the webhook flip the row to `completed` after Stripe confirms.
 */
export const purchaseProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, seller_id, price, currency, status, downloads_count, title, affiliate_commission_pct")
      .eq("id", data.productId)
      .maybeSingle();

    if (pErr || !product) throw new Response("Product not found", { status: 404 });
    if (product.status !== "published") throw new Response("Product not available", { status: 400 });
    if (product.seller_id === userId) throw new Response("Cannot purchase your own product", { status: 400 });

    // Reject duplicates
    const { data: existing } = await supabaseAdmin
      .from("transactions")
      .select("id, status")
      .eq("product_id", product.id)
      .eq("buyer_id", userId)
      .eq("status", "completed")
      .limit(1)
      .maybeSingle();
    if (existing) return { transactionId: existing.id, status: "completed" as const, alreadyOwned: true };

    // Validate affiliate
    let affiliateUserId: string | null = null;
    let affiliatePct = 0;
    if (
      data.referralUserId &&
      data.referralUserId !== userId &&
      data.referralUserId !== product.seller_id &&
      (product.affiliate_commission_pct ?? 0) > 0
    ) {
      const { data: refProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", data.referralUserId)
        .maybeSingle();
      if (refProfile) {
        affiliateUserId = data.referralUserId;
        affiliatePct = Number(product.affiliate_commission_pct);
      }
    }

    const price = Number(product.price);
    const isFree = price === 0;
    const status = isFree ? "completed" : "pending";

    const platformAmount = +(price * (PLATFORM_FEE_PCT / 100)).toFixed(2);
    const affiliateAmount = affiliateUserId ? +(price * (affiliatePct / 100)).toFixed(2) : 0;
    const sellerAmount = +(price - platformAmount - affiliateAmount).toFixed(2);

    const { data: tx, error: tErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        product_id: product.id,
        buyer_id: userId,
        seller_id: product.seller_id,
        amount: price,
        currency: product.currency,
        status,
        affiliate_user_id: affiliateUserId,
        affiliate_commission_pct: affiliatePct,
        platform_amount: platformAmount,
        affiliate_amount: affiliateAmount,
        seller_amount: sellerAmount,
      } as any)
      .select("id, status")
      .single();
    if (tErr || !tx) throw new Response(tErr?.message ?? "Could not create transaction", { status: 500 });

    if (isFree) {
      await supabaseAdmin
        .from("products")
        .update({ downloads_count: (product.downloads_count ?? 0) + 1 })
        .eq("id", product.id);
      return { transactionId: tx.id, status: "completed" as const, alreadyOwned: false };
    }

    // ---- Stripe Embedded Checkout ----
    const env = data.environment ?? "sandbox";
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    const stripe = createStripeClient(env);

    const currency = String(product.currency ?? "PLN").toLowerCase();
    // BLIK requires PLN. Promote BLIK first for Polish currency; fall back to card + p24 otherwise.
    const paymentMethodTypes =
      currency === "pln"
        ? (["blik", "card", "p24"] as const)
        : (["card"] as const);

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: `${data.returnUrl ?? ""}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        payment_method_types: paymentMethodTypes as any,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: Math.round(price * 100),
              product_data: {
                name: product.title,
              },
            },
          },
        ],
        payment_intent_data: {
          description: product.title,
          metadata: {
            transactionId: tx.id,
            productId: product.id,
            buyerId: userId,
            sellerId: product.seller_id,
          },
        },
        metadata: {
          transactionId: tx.id,
          productId: product.id,
          buyerId: userId,
        },
      });

      // Persist Stripe session id for reconciliation
      await supabaseAdmin
        .from("transactions")
        .update({ stripe_session_id: session.id } as any)
        .eq("id", tx.id);

      return {
        transactionId: tx.id,
        status: "pending" as const,
        alreadyOwned: false,
        clientSecret: session.client_secret ?? "",
      };
    } catch (error) {
      // Roll back the pending row so the buyer can retry cleanly
      await supabaseAdmin.from("transactions").delete().eq("id", tx.id);
      throw new Response(getStripeErrorMessage(error), { status: 500 });
    }
  });
