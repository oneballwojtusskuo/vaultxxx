import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Statuses that mean the buyer actually has access to the product. */
const OWNED_STATUSES = ["held", "released", "completed", "disputed"];

/**
 * Returns the signed-in user's transactions (purchases, sales, affiliate).
 * Client access to `public.transactions` is revoked, so this goes through the
 * admin client — always scoped to the authenticated user id.
 */
export const getMyTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const select =
      "id, product_id, amount, buyer_price, seller_amount, affiliate_amount, affiliate_commission_pct, currency, status, created_at, released_at, buyer_id, seller_id";

    const [purchasesRes, salesRes, affiliateRes] = await Promise.all([
      supabaseAdmin
        .from("transactions")
        .select(select)
        .eq("buyer_id", userId)
        .in("status", OWNED_STATUSES as any)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("transactions")
        .select(select)
        .eq("seller_id", userId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("transactions")
        .select(select)
        .eq("affiliate_user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const rows = [
      ...(purchasesRes.data ?? []),
      ...(salesRes.data ?? []),
      ...(affiliateRes.data ?? []),
    ];
    const productIds = Array.from(new Set(rows.map((r: any) => r.product_id).filter(Boolean)));

    let productsById: Record<string, any> = {};
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id, title, preview_url, license_terms, seller_id, delivery_mode")
        .in("id", productIds);

      const sellerIds = Array.from(new Set((products ?? []).map((p: any) => p.seller_id)));
      const { data: sellers } = await supabaseAdmin
        .from("profiles")
        .select("id, username, display_name")
        .in("id", sellerIds.length ? sellerIds : ["00000000-0000-0000-0000-000000000000"]);
      const sellerById = Object.fromEntries((sellers ?? []).map((s: any) => [s.id, s]));

      productsById = Object.fromEntries(
        (products ?? []).map((p: any) => [p.id, { ...p, seller: sellerById[p.seller_id] ?? null }]),
      );
    }

    const attach = (list: any[] | null) =>
      (list ?? []).map((t: any) => ({ ...t, product: productsById[t.product_id] ?? null }));

    return {
      purchases: attach(purchasesRes.data),
      sales: attach(salesRes.data),
      affiliate: attach(affiliateRes.data),
    };
  });
