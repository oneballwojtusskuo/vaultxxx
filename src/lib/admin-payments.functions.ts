import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-only overview of all orders, payouts and their statuses. */
export const listAdminPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAdminClientForContext } = await import("@/lib/admin-auth.server");
    const admin = await getAdminClientForContext(context);

    const { data: txs, error } = await admin
      .from("transactions")
      .select(
        "id,product_id,buyer_id,seller_id,amount,buyer_price,currency,status,source,created_at,held_at,auto_release_at,released_at,disputed_at,dispute_reason,seller_amount,platform_amount,affiliate_amount,affiliate_user_id,payout_status,payout_error,stripe_env,stripe_session_id,stripe_payment_intent_id,stripe_transfer_id",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    const { data: payouts, error: pErr } = await admin
      .from("affiliate_payouts")
      .select("id,user_id,amount,currency,status,paid_at,created_at,environment,stripe_transfer_id,error")
      .order("created_at", { ascending: false })
      .limit(200);
    if (pErr) throw pErr;

    const productIds = [...new Set((txs ?? []).map((t) => t.product_id).filter(Boolean))] as string[];
    const userIds = [
      ...new Set(
        [
          ...(txs ?? []).flatMap((t) => [t.buyer_id, t.seller_id, t.affiliate_user_id]),
          ...(payouts ?? []).map((p) => p.user_id),
        ].filter(Boolean),
      ),
    ] as string[];

    const [{ data: products }, { data: profiles }, usersRes] = await Promise.all([
      productIds.length
        ? admin.from("products").select("id,title").in("id", productIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      userIds.length
        ? admin.from("profiles").select("id,username,display_name").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const titles = new Map((products ?? []).map((p: any) => [p.id, p.title as string]));
    const emails = new Map((usersRes.data?.users ?? []).map((u) => [u.id, u.email ?? null]));
    const names = new Map(
      (profiles ?? []).map((p: any) => [p.id, (p.username || p.display_name || null) as string | null]),
    );
    const who = (id: string | null) =>
      id ? { id, name: names.get(id) ?? null, email: emails.get(id) ?? null } : null;

    return {
      transactions: (txs ?? []).map((t) => ({
        ...t,
        product_title: t.product_id ? titles.get(t.product_id) ?? "(usunięty produkt)" : "—",
        buyer: who(t.buyer_id),
        seller: who(t.seller_id),
        affiliate: who(t.affiliate_user_id),
      })),
      payouts: (payouts ?? []).map((p) => ({ ...p, user: who(p.user_id) })),
    };
  });
