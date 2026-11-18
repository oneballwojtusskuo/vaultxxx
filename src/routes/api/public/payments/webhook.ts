import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { matchesPayment } from "@/lib/webhook-security";
import { z } from "zod";

async function getSupabase() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function completeTransaction(transactionId: string) {
  const supabase = await getSupabase();
  let { data: tx } = await supabase
    .from("transactions")
    .select(
      "id, product_id, seller_id, buyer_id, status, amount, seller_amount, currency, stripe_payment_intent_id",
    )
    .eq("id", transactionId)
    .maybeSingle();
  if (!tx) {
    const fallback = await supabase
      .from("transactions")
      .select("id, product_id, seller_id, buyer_id, status, amount, currency")
      .eq("id", transactionId)
      .maybeSingle();
    tx = fallback.data as typeof tx;
  }
  // Idempotent: only promote from `pending`. Any other state (held/released/disputed/failed) is a no-op.
  if (!tx || tx.status !== "pending") return;

  const escrowUpdate = await supabase
    .from("transactions")
    .update({ status: "held", held_at: new Date().toISOString(),
      auto_release_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), payout_status: "held" })
    .eq("id", transactionId).eq("status", "pending").select("id").maybeSingle();
  if (escrowUpdate.error) throw escrowUpdate.error;
  if (!escrowUpdate.data) return;

  if (tx.product_id) {
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
  }
  // Seller & affiliate notifications are inserted by DB triggers on transactions.
  await sendDownloadEmail(tx.id, tx.buyer_id, tx.product_id);
}

/** Emails the buyer a direct, login-free download link. Never blocks fulfillment. */
async function sendDownloadEmail(transactionId: string, buyerId: string | null, productId: string | null) {
  try {
    const secret = process.env.DOWNLOAD_LINK_SECRET;
    if (!secret || !buyerId) return;
    const supabase = await getSupabase();
    const { data: u } = await supabase.auth.admin.getUserById(buyerId);
    const email = u?.user?.email;
    if (!email) return;
    const { data: p } = productId
      ? await supabase.from("products").select("title").eq("id", productId).maybeSingle()
      : { data: null };
    const { createDownloadToken } = await import("@/lib/download-token");
    const token = await createDownloadToken(secret, transactionId);
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    await sendTemplateEmail("purchase-download", email, {
      templateData: { productTitle: p?.title ?? undefined, downloadUrl: `https://vlnd.pl/api/public/download?t=${token}` },
      idempotencyKey: `purchase-download-${transactionId}`,
    });
  } catch (e) {
    console.error("Download email failed:", e);
  }
}

async function failTransaction(transactionId: string) {
  const supabase = await getSupabase();
  await supabase
    .from("transactions")
    .update({ status: "failed" })
    .eq("id", transactionId)
    .eq("status", "pending");
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const object = event.data.object;
  const id = z.string().uuid().safeParse(object.metadata?.transactionId);
  if (!id.success) return;
  const supabase = await getSupabase();
  const { data: tx, error } = await supabase.from("transactions")
    .select("id, status, amount, currency, stripe_env, stripe_session_id, stripe_payment_intent_id")
    .eq("id", id.data).maybeSingle();
  if (error) throw error;
  if (!tx || tx.status !== "pending" || tx.stripe_env !== env) return;

  if (event.type.startsWith("checkout.session.")) {
    if (tx.stripe_session_id !== object.id) throw new Error("Checkout session mismatch");
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
      if (object.payment_status !== "paid") return;
      if (!matchesPayment(tx, object.amount_total, object.currency, env)) throw new Error("Payment amount mismatch");
      if (typeof object.payment_intent === "string") {
        const result = await supabase.from("transactions").update({ stripe_payment_intent_id: object.payment_intent })
          .eq("id", tx.id).eq("status", "pending");
        if (result.error) throw result.error;
      }
      await completeTransaction(tx.id);
    } else if (["checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type)) {
      await failTransaction(tx.id);
    }
  } else if (event.type === "payment_intent.succeeded") {
    if (!tx.stripe_session_id || object.status !== "succeeded") return;
    if (!matchesPayment(tx, object.amount_received, object.currency, env)) throw new Error("Payment amount mismatch");
    // Resolve the stored checkout, not caller-supplied metadata alone.
    const { createStripeClient } = await import("@/lib/stripe.server");
    const session = await createStripeClient(env).checkout.sessions.retrieve(tx.stripe_session_id);
    if (session.payment_intent !== object.id || session.metadata?.transactionId !== tx.id) throw new Error("Payment intent mismatch");
    const result = await supabase.from("transactions").update({ stripe_payment_intent_id: object.id })
      .eq("id", tx.id).eq("status", "pending");
    if (result.error) throw result.error;
    await completeTransaction(tx.id);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const queryEnv = new URL(request.url).searchParams.get("env");
        if (queryEnv !== "live" && queryEnv !== "sandbox") return new Response("Invalid environment", { status: 400 });
        const rawEnv: StripeEnv = queryEnv;
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
