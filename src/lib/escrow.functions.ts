import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Buyer confirms delivery — funds are released from escrow to the seller.
 * Allowed only for the buyer of the transaction, when it's currently `held`.
 */
export const confirmDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ transactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tx, error } = await supabaseAdmin
      .from("transactions")
      .select("id, buyer_id, seller_id, status, product_id, seller_amount, currency")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (error || !tx) throw new Response("Transaction not found", { status: 404 });
    if (tx.buyer_id !== userId) throw new Response("Forbidden", { status: 403 });
    if (tx.status !== "held") throw new Response("Transaction is not in escrow", { status: 400 });

    const { error: uErr } = await supabaseAdmin
      .from("transactions")
      .update({ status: "released" as any, released_at: new Date().toISOString() } as any)
      .eq("id", tx.id);
    if (uErr) throw new Response(uErr.message, { status: 500 });

    // Notify the seller that funds have been released.
    await supabaseAdmin.from("seller_notifications").insert({
      user_id: tx.seller_id,
      type: "funds_released",
      title: "Środki zwolnione z depozytu",
      body: `Kupujący potwierdził odbiór — ${Number(tx.seller_amount).toFixed(2)} ${tx.currency} zostało zwolnione do wypłaty.`,
      link: `/dashboard`,
    } as any);

    return { ok: true };
  });

/**
 * Buyer disputes the purchase — moves escrow into `disputed` state.
 * Funds stay held; the seller (and later admin) is notified so it can be resolved.
 */
export const disputeDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        transactionId: z.string().uuid(),
        reason: z.string().trim().min(10, "Opisz problem (min. 10 znaków)").max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tx, error } = await supabaseAdmin
      .from("transactions")
      .select("id, buyer_id, seller_id, status, product_id")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (error || !tx) throw new Response("Transaction not found", { status: 404 });
    if (tx.buyer_id !== userId) throw new Response("Forbidden", { status: 403 });
    if (tx.status !== "held") throw new Response("Only held transactions can be disputed", { status: 400 });

    const { error: uErr } = await supabaseAdmin
      .from("transactions")
      .update({
        status: "disputed" as any,
        disputed_at: new Date().toISOString(),
        dispute_reason: data.reason,
      } as any)
      .eq("id", tx.id);
    if (uErr) throw new Response(uErr.message, { status: 500 });

    await supabaseAdmin.from("seller_notifications").insert({
      user_id: tx.seller_id,
      type: "dispute_opened",
      title: "Kupujący zgłosił problem z transakcją",
      body: data.reason.slice(0, 240),
      link: `/dashboard`,
    } as any);

    return { ok: true };
  });
