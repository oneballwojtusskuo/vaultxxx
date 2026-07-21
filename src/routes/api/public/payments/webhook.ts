import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}

async function completeTransaction(transactionId: string) {
  const supabase = getSupabase();
  const { data: tx } = await supabase
    .from("transactions")
    .select("id, product_id, seller_id, buyer_id, status, amount, seller_amount, currency")
    .eq("id", transactionId)
    .maybeSingle();
  // Idempotent: only promote from `pending`. Any other state (held/released/disputed/failed) is a no-op.
  if (!tx || tx.status !== "pending") return;

  await supabase
    .from("transactions")
    .update({ status: "held" as any })
    .eq("id", transactionId);

  const { data: p } = await supabase
    .from("products")
    .select("title, downloads_count")
    .eq("id", tx.product_id)
    .maybeSingle();
  if (p) {
    await supabase
      .from("products")
      .update({ downloads_count: (p.downloads_count ?? 0) + 1 })
      .eq("id", tx.product_id);
  }

  // Notify seller about the new purchase (funds are held in escrow).
  if (tx.seller_id) {
    const amt = Number(tx.seller_amount ?? tx.amount).toFixed(2);
    await supabase.from("seller_notifications").insert({
      user_id: tx.seller_id,
      type: "new_sale",
      title: "Nowa sprzedaż!",
      body: `Ktoś kupił „${p?.title ?? "Twój produkt"}" — ${amt} ${tx.currency} czeka w depozycie do potwierdzenia odbioru.`,
      link: `/dashboard`,
    } as any);
  }
}

async function failTransaction(transactionId: string) {
  const supabase = getSupabase();
  await supabase
    .from("transactions")
    .update({ status: "failed" })
    .eq("id", transactionId)
    .eq("status", "pending");
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      const txId = session?.metadata?.transactionId;
      if (txId && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
        await completeTransaction(txId);
      }
      break;
    }
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const session = event.data.object;
      const txId = session?.metadata?.transactionId;
      if (txId) await failTransaction(txId);
      break;
    }
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const txId = pi?.metadata?.transactionId;
      if (txId) await completeTransaction(txId);
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      const txId = pi?.metadata?.transactionId;
      if (txId) await failTransaction(txId);
      break;
    }
    default:
      console.log("Unhandled Stripe event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
