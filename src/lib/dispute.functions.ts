import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function isAdmin(supabaseAdmin: any, userId: string, claims: unknown) {
  const { isOwnerAdminEmail } = await import("@/lib/admin-auth.server");
  if (isOwnerAdminEmail(claims)) return true;
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

async function notify(
  supabaseAdmin: any,
  userId: string,
  title: string,
  body: string,
  link: string,
) {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "dispute",
    title,
    body,
    link,
  } as any);
}

export async function openDisputeThread(
  supabaseAdmin: any,
  tx: { id: string; buyer_id: string; seller_id: string; product_id: string | null },
  reason: string,
) {
  const { data: thread } = await supabaseAdmin
    .from("dispute_threads")
    .upsert(
      {
        transaction_id: tx.id,
        buyer_id: tx.buyer_id,
        seller_id: tx.seller_id,
        status: "open",
      } as any,
      { onConflict: "transaction_id" },
    )
    .select("id")
    .single();

  if (thread?.id) {
    await supabaseAdmin.from("dispute_messages").insert({
      thread_id: thread.id,
      sender_id: tx.buyer_id,
      content: `Zgłoszenie problemu: ${reason}`,
    } as any);
  }

  const link = `/spory/${tx.id}`;
  const body =
    "Otwarto spór po zakupie. Wejdź do czatu — uczestniczą kupujący, sprzedawca i administrator.";

  await notify(supabaseAdmin, tx.buyer_id, "Twój spór został otwarty", body, link);
  await notify(supabaseAdmin, tx.seller_id, "Kupujący zgłosił problem z transakcją", body, link);

  const { data: admins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  for (const a of admins ?? []) {
    if (a.user_id !== tx.buyer_id && a.user_id !== tx.seller_id) {
      await notify(supabaseAdmin, a.user_id, "Nowy spór do rozstrzygnięcia", body, "/admin");
    }
  }

  return thread;
}

export const listDisputeThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAdminClientForContext } = await import("@/lib/admin-auth.server");
    const supabaseAdmin = await getAdminClientForContext(context);

    const { data: threads, error } = await supabaseAdmin
      .from("dispute_threads")
      .select("id, transaction_id, buyer_id, seller_id, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const txIds = (threads ?? []).map((t: any) => t.transaction_id);
    const { data: txs } = txIds.length
      ? await supabaseAdmin
          .from("transactions")
          .select("id, product_id, dispute_reason, seller_amount, currency, status")
          .in("id", txIds)
      : { data: [] as any[] };

    const productIds = Array.from(
      new Set((txs ?? []).map((t: any) => t.product_id).filter(Boolean)),
    );
    const { data: products } = productIds.length
      ? await supabaseAdmin.from("products").select("id, title").in("id", productIds)
      : { data: [] as any[] };

    const userIds = Array.from(
      new Set((threads ?? []).flatMap((t: any) => [t.buyer_id, t.seller_id])),
    );
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, username, display_name").in("id", userIds)
      : { data: [] as any[] };

    const txBy = Object.fromEntries((txs ?? []).map((t: any) => [t.id, t]));
    const pBy = Object.fromEntries((products ?? []).map((p: any) => [p.id, p]));
    const uBy = Object.fromEntries((profiles ?? []).map((u: any) => [u.id, u]));

    return (threads ?? []).map((t: any) => {
      const tx = txBy[t.transaction_id];
      return {
        ...t,
        dispute_reason: tx?.dispute_reason ?? null,
        amount: tx?.seller_amount ?? null,
        currency: tx?.currency ?? "PLN",
        tx_status: tx?.status ?? null,
        product: pBy[tx?.product_id] ?? null,
        buyer: uBy[t.buyer_id] ?? null,
        seller: uBy[t.seller_id] ?? null,
      };
    });
  });

export const getDisputeChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ transactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = await isAdmin(supabaseAdmin, context.userId, context.claims);

    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select(
        "id, buyer_id, seller_id, product_id, status, dispute_reason, seller_amount, currency",
      )
      .eq("id", data.transactionId)
      .maybeSingle();
    if (!tx) throw new Response("Nie znaleziono transakcji", { status: 404 });
    if (tx.buyer_id !== context.userId && tx.seller_id !== context.userId && !admin) {
      throw new Response("Forbidden", { status: 403 });
    }

    const { data: thread } = await supabaseAdmin
      .from("dispute_threads")
      .select("*")
      .eq("transaction_id", tx.id)
      .maybeSingle();
    if (!thread) throw new Response("Brak wątku sporu", { status: 404 });

    const { data: messages } = await supabaseAdmin
      .from("dispute_messages")
      .select("*")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });

    const ids = Array.from(
      new Set([tx.buyer_id, tx.seller_id, ...(messages ?? []).map((m: any) => m.sender_id)]),
    );
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", ids);

    const { data: product } = tx.product_id
      ? await supabaseAdmin
          .from("products")
          .select("id, title")
          .eq("id", tx.product_id)
          .maybeSingle()
      : { data: null };

    const { data: adminRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminIds = new Set((adminRows ?? []).map((r: any) => r.user_id));

    return {
      thread,
      transaction: tx,
      product,
      messages: messages ?? [],
      profiles: profiles ?? [],
      adminIds: Array.from(adminIds),
      isAdmin: admin,
      role:
        context.userId === tx.buyer_id
          ? "buyer"
          : context.userId === tx.seller_id
            ? "seller"
            : "admin",
    };
  });

export const sendDisputeMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ transactionId: z.string().uuid(), content: z.string().trim().min(1).max(4000) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = await isAdmin(supabaseAdmin, context.userId, context.claims);
    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("id, buyer_id, seller_id")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (!tx) throw new Response("Nie znaleziono transakcji", { status: 404 });
    if (tx.buyer_id !== context.userId && tx.seller_id !== context.userId && !admin) {
      throw new Response("Forbidden", { status: 403 });
    }
    const { data: thread } = await supabaseAdmin
      .from("dispute_threads")
      .select("id")
      .eq("transaction_id", tx.id)
      .maybeSingle();
    if (!thread) throw new Response("Brak wątku sporu", { status: 404 });
    await supabaseAdmin.from("dispute_messages").insert({
      thread_id: thread.id,
      sender_id: context.userId,
      content: data.content,
    } as any);
    return { ok: true };
  });

export const resolveDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        transactionId: z.string().uuid(),
        outcome: z.enum(["release", "refund"]),
        note: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getAdminClientForContext } = await import("@/lib/admin-auth.server");
    const supabaseAdmin = await getAdminClientForContext(context);

    const { data: tx } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("id", data.transactionId)
      .maybeSingle();
    if (!tx) throw new Response("Nie znaleziono transakcji", { status: 404 });
    if (tx.status !== "disputed" && tx.status !== "held") {
      throw new Response("Ten spór nie jest już otwarty", { status: 400 });
    }

    if (data.outcome === "release") {
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
          payout_status: "queued",
        } as any)
        .eq("id", tx.id);
    } else {
      const pi = (tx as any).stripe_payment_intent_id as string | null;
      if (pi) {
        try {
          const { createStripeClient, getServerStripeEnv } = await import("@/lib/stripe.server");
          const stripe = createStripeClient(getServerStripeEnv());
          await stripe.refunds.create({ payment_intent: pi });
        } catch (e) {
          console.error("Stripe refund failed", e);
        }
      }
      await supabaseAdmin
        .from("transactions")
        .update({ status: "refunded", payout_status: "refunded" } as any)
        .eq("id", tx.id);
    }

    await supabaseAdmin
      .from("dispute_threads")
      .update({ status: "closed" } as any)
      .eq("transaction_id", tx.id);

    const note = data.note ? ` Komentarz admina: ${data.note}` : "";
    const link = `/spory/${tx.id}`;
    if (data.outcome === "release") {
      await notify(
        supabaseAdmin,
        tx.seller_id,
        "Spór rozstrzygnięty — środki dla sprzedawcy",
        `Administrator zwolnił depozyt.${note}`,
        link,
      );
      await notify(
        supabaseAdmin,
        tx.buyer_id,
        "Spór rozstrzygnięty",
        `Środki pozostają u sprzedawcy.${note}`,
        link,
      );
    } else {
      await notify(
        supabaseAdmin,
        tx.buyer_id,
        "Spór rozstrzygnięty — zwrot",
        `Administrator zlecił zwrot środków.${note}`,
        link,
      );
      await notify(
        supabaseAdmin,
        tx.seller_id,
        "Spór rozstrzygnięty — zwrot dla kupującego",
        `Depozyt wraca do kupującego.${note}`,
        link,
      );
    }

    return { ok: true };
  });
