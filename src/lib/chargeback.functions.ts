import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({ transactionId: z.string().uuid() });

export type ChargebackEvidence = {
  transaction: {
    id: string;
    status: string;
    amount: number;
    buyerPrice: number | null;
    sellerAmount: number | null;
    currency: string;
    createdAt: string;
    heldAt: string | null;
    releasedAt: string | null;
    stripeSessionId: string | null;
    stripePaymentIntentId: string | null;
  };
  product: { id: string | null; title: string | null };
  buyer: { id: string; name: string | null; email: string | null };
  seller: { id: string; name: string | null; email: string | null };
  waiverAccepted: boolean;
  licenseHash: string | null;
  checkout: { ip: string | null; userAgent: string | null; at: string | null } | null;
  downloads: Array<{ ip: string | null; userAgent: string | null; at: string | null }>;
  generatedAt: string;
};

/** Admin-only evidence pack for a Stripe chargeback dispute. */
export const getChargebackEvidence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<ChargebackEvidence> => {
    const { getAdminClientForContext } = await import("@/lib/admin-auth.server");
    const supabaseAdmin = await getAdminClientForContext(context);

    const { data: tx, error } = await supabaseAdmin
      .from("transactions")
      .select(
        "id, status, amount, buyer_price, seller_amount, currency, created_at, held_at, released_at, stripe_session_id, stripe_payment_intent_id, product_id, buyer_id, seller_id",
      )
      .eq("id", data.transactionId)
      .maybeSingle();
    if (error || !tx) throw new Response("Transaction not found", { status: 404 });

    const [{ data: product }, { data: profiles }, { data: logs }] = await Promise.all([
      tx.product_id
        ? supabaseAdmin.from("products").select("id, title").eq("id", tx.product_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      supabaseAdmin
        .from("profiles")
        .select("id, display_name, username")
        .in("id", [tx.buyer_id, tx.seller_id]),
      supabaseAdmin
        .from("transaction_audit_logs")
        .select(
          "event_type, ip_address, user_agent, timestamp_checkout, timestamp_downloaded, withdrawal_waiver_accepted, license_hash, created_at",
        )
        .eq("transaction_id", tx.id)
        .order("created_at", { ascending: true }),
    ]);

    const nameOf = (id: string) => {
      const p = (profiles ?? []).find((row: any) => row.id === id);
      return p ? (p.display_name ?? p.username ?? null) : null;
    };
    const emailOf = async (id: string) => {
      try {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
        return u?.user?.email ?? null;
      } catch {
        return null;
      }
    };

    const rows = (logs ?? []) as any[];
    const checkoutRow = rows.find((r) => r.event_type === "checkout") ?? null;
    const downloadRows = rows.filter((r) => r.event_type === "download");

    const [buyerEmail, sellerEmail] = await Promise.all([
      emailOf(tx.buyer_id),
      emailOf(tx.seller_id),
    ]);

    return {
      transaction: {
        id: tx.id,
        status: String(tx.status),
        amount: Number(tx.amount),
        buyerPrice: tx.buyer_price != null ? Number(tx.buyer_price) : null,
        sellerAmount: tx.seller_amount != null ? Number(tx.seller_amount) : null,
        currency: String(tx.currency ?? "PLN"),
        createdAt: tx.created_at,
        heldAt: tx.held_at ?? null,
        releasedAt: tx.released_at ?? null,
        stripeSessionId: tx.stripe_session_id ?? null,
        stripePaymentIntentId: tx.stripe_payment_intent_id ?? null,
      },
      product: { id: product?.id ?? null, title: product?.title ?? null },
      buyer: { id: tx.buyer_id, name: nameOf(tx.buyer_id), email: buyerEmail },
      seller: { id: tx.seller_id, name: nameOf(tx.seller_id), email: sellerEmail },
      waiverAccepted: Boolean(checkoutRow?.withdrawal_waiver_accepted),
      licenseHash: checkoutRow?.license_hash ?? null,
      checkout: checkoutRow
        ? {
            ip: checkoutRow.ip_address ?? null,
            userAgent: checkoutRow.user_agent ?? null,
            at: checkoutRow.timestamp_checkout ?? checkoutRow.created_at ?? null,
          }
        : null,
      downloads: downloadRows.map((r) => ({
        ip: r.ip_address ?? null,
        userAgent: r.user_agent ?? null,
        at: r.timestamp_downloaded ?? r.created_at ?? null,
      })),
      generatedAt: new Date().toISOString(),
    };
  });

/** Admin list of paid transactions to pick from when building an evidence pack. */
export const listAdminTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAdminClientForContext } = await import("@/lib/admin-auth.server");
    const supabaseAdmin = await getAdminClientForContext(context);

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("id, status, amount, currency, created_at, product_id, buyer_id")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const productIds = Array.from(
      new Set((data ?? []).map((t: any) => t.product_id).filter(Boolean)),
    );
    const { data: products } = productIds.length
      ? await supabaseAdmin.from("products").select("id, title").in("id", productIds)
      : ({ data: [] } as any);

    return (data ?? []).map((t: any) => ({
      id: t.id,
      status: String(t.status),
      amount: Number(t.amount),
      currency: String(t.currency ?? "PLN"),
      createdAt: t.created_at,
      productTitle:
        (products ?? []).find((p: any) => p.id === t.product_id)?.title ?? "(produkt usunięty)",
    }));
  });
