import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({ productId: z.string().uuid() });

/**
 * Create a transaction for the authenticated buyer.
 * - Free products (price = 0): immediately marked `completed`.
 * - Paid products: created as `pending`. Completion requires a verified
 *   payment webhook (not yet integrated). This prevents users from forging
 *   completed transactions to unlock paid content.
 */
export const purchaseProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, seller_id, price, currency, status, downloads_count")
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

    const isFree = Number(product.price) === 0;
    const status = isFree ? "completed" : "pending";

    const { data: tx, error: tErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        product_id: product.id,
        buyer_id: userId,
        seller_id: product.seller_id,
        amount: product.price,
        currency: product.currency,
        status,
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
