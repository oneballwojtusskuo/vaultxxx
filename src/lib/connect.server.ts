// Stripe Connect helpers (server only).
// Creators get Stripe-hosted accounts (Accounts v2, "recipient" configuration).
// Seller share is transferred from the platform balance to the creator's
// account when escrow is released; Stripe then pays it out to their bank.
import { createStripeClient, getServerStripeEnv, type StripeEnv } from "@/lib/stripe.server";

type Admin = any;

export const AFFILIATE_MIN_WITHDRAWAL_PLN = 100;

export async function syncConnectAccount(
  admin: Admin,
  env: StripeEnv,
  userId: string,
  accountId: string,
) {
  const stripe: any = createStripeClient(env);
  const acct = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient", "requirements"],
  });
  const caps = acct?.configuration?.recipient?.capabilities?.stripe_balance ?? {};
  const transfers = caps?.stripe_transfers?.status === "active";
  const payouts = caps?.payouts?.status === "active";
  const row = {
    user_id: userId,
    environment: env,
    stripe_account_id: accountId,
    transfers_enabled: transfers,
    payouts_enabled: payouts,
    details_submitted: transfers || payouts,
  };
  await admin.from("stripe_connect_accounts").upsert(row, { onConflict: "user_id,environment" });
  return row;
}

/** Sends the seller's share of a released transaction to their Stripe account. */
export async function payoutSellerForTransaction(admin: Admin, transactionId: string) {
  const { data: tx } = await admin
    .from("transactions")
    .select(
      "id, seller_id, status, seller_amount, currency, stripe_payment_intent_id, stripe_transfer_id, stripe_env",
    )
    .eq("id", transactionId)
    .maybeSingle();
  if (!tx || tx.stripe_transfer_id) return;
  if (tx.status !== "released") return;
  const amount = Math.round(Number(tx.seller_amount ?? 0) * 100);
  if (amount <= 0 || !tx.stripe_payment_intent_id) {
    await admin.from("transactions").update({ payout_status: "not_required" }).eq("id", tx.id);
    return;
  }
  const env: StripeEnv = (tx.stripe_env as StripeEnv) ?? getServerStripeEnv();

  const { data: acct } = await admin
    .from("stripe_connect_accounts")
    .select("stripe_account_id, transfers_enabled")
    .eq("user_id", tx.seller_id)
    .eq("environment", env)
    .maybeSingle();
  if (!acct?.transfers_enabled) {
    await admin
      .from("transactions")
      .update({ payout_status: "awaiting_account", payout_error: null })
      .eq("id", tx.id);
    return;
  }

  try {
    const stripe: any = createStripeClient(env);
    const pi = await stripe.paymentIntents.retrieve(tx.stripe_payment_intent_id);
    const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id;
    const transfer = await stripe.transfers.create(
      {
        amount,
        currency: String(tx.currency ?? "PLN").toLowerCase(),
        destination: acct.stripe_account_id,
        transfer_group: tx.id,
        ...(chargeId ? { source_transaction: chargeId } : {}),
        metadata: { transactionId: tx.id, kind: "seller_payout" },
      },
      { idempotencyKey: `seller-payout-${tx.id}` },
    );
    await admin
      .from("transactions")
      .update({ stripe_transfer_id: transfer.id, payout_status: "paid", payout_error: null })
      .eq("id", tx.id);
  } catch (e: any) {
    console.error("Seller transfer failed", tx.id, e?.message);
    await admin
      .from("transactions")
      .update({ payout_status: "failed", payout_error: String(e?.message ?? e).slice(0, 500) })
      .eq("id", tx.id);
  }
}

/** Retries every released sale whose seller share hasn't been transferred yet. */
export async function processPendingSellerPayouts(admin: Admin) {
  const { data } = await admin
    .from("transactions")
    .select("id")
    .eq("status", "released")
    .is("stripe_transfer_id", null)
    .gt("seller_amount", 0)
    .not("stripe_payment_intent_id", "is", null)
    .order("released_at", { ascending: true })
    .limit(50);
  for (const row of data ?? []) {
    await payoutSellerForTransaction(admin, row.id);
  }
}
