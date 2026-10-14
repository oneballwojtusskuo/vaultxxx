import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const EnvSchema = z.object({ environment: z.enum(["sandbox", "live"]) });

function appOrigin() {
  const req = getRequest();
  const h = req?.headers.get("origin");
  try {
    return new URL(h || req?.url || "").origin;
  } catch {
    return "https://vlnd.pl";
  }
}

/** Creates (once) the creator's Stripe account and returns the onboarding link. */
export const startConnectOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => EnvSchema.parse(i))
  .handler(async ({ data, context }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { createStripeClient } = await import("@/lib/stripe.server");
      const stripe: any = createStripeClient(data.environment);
      const userId = context.userId;

      const { data: existing } = await supabaseAdmin
        .from("stripe_connect_accounts")
        .select("stripe_account_id")
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .maybeSingle();

      let accountId = existing?.stripe_account_id as string | undefined;
      if (!accountId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("username, display_name")
          .eq("id", userId)
          .maybeSingle();
        const email = (context.claims as any)?.email as string | undefined;
        const acct = await stripe.v2.core.accounts.create({
          ...(email ? { contact_email: email } : {}),
          display_name: profile?.display_name || profile?.username || "Twórca vlnd",
          dashboard: "express",
          identity: { country: "pl" },
          configuration: {
            recipient: {
              capabilities: { stripe_balance: { stripe_transfers: { requested: true } } },
            },
          },
          defaults: {
            currency: "pln",
            responsibilities: { fees_collector: "application", losses_collector: "application" },
          },
          metadata: { userId },
        });
        accountId = acct.id as string;
        await supabaseAdmin.from("stripe_connect_accounts").insert({
          user_id: userId,
          environment: data.environment,
          stripe_account_id: accountId,
        } as any);
      }

      const origin = appOrigin();
      const back = `${origin}/dashboard?tab=payouts`;
      const link = await stripe.v2.core.accountLinks.create({
        account: accountId,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            configurations: ["recipient"],
            refresh_url: `${back}&connect=refresh`,
            return_url: `${back}&connect=return`,
          },
        },
      });
      return { url: link.url as string };
    } catch (e) {
      const { getStripeErrorMessage } = await import("@/lib/stripe.server");
      return { error: getStripeErrorMessage(e) };
    }
  });

/** Refreshes and returns the creator's Stripe account status. */
export const getConnectStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => EnvSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .select("stripe_account_id, transfers_enabled, payouts_enabled")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .maybeSingle();
    if (!row) return { connected: false, transfersEnabled: false, payoutsEnabled: false };
    try {
      const { syncConnectAccount, processPendingSellerPayouts } = await import(
        "@/lib/connect.server"
      );
      const synced = await syncConnectAccount(
        supabaseAdmin,
        data.environment,
        context.userId,
        row.stripe_account_id,
      );
      // Account just became ready — send any sales that were waiting for it.
      if (synced.transfers_enabled && !row.transfers_enabled) {
        await processPendingSellerPayouts(supabaseAdmin);
      }
      return {
        connected: true,
        transfersEnabled: synced.transfers_enabled,
        payoutsEnabled: synced.payouts_enabled,
      };
    } catch {
      return {
        connected: true,
        transfersEnabled: row.transfers_enabled,
        payoutsEnabled: row.payouts_enabled,
      };
    }
  });

/** Link to the creator's Stripe Express dashboard (payout history, bank account). */
export const getStripeDashboardLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => EnvSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    const { data: row } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .select("stripe_account_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .maybeSingle();
    if (!row) return { error: "Najpierw połącz konto Stripe." };
    try {
      const stripe = createStripeClient(data.environment);
      const link = await stripe.accounts.createLoginLink(row.stripe_account_id);
      return { url: link.url };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

/** Affiliate wallet: balances + withdrawal history. */
export const getAffiliateWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { AFFILIATE_MIN_WITHDRAWAL_PLN } = await import("@/lib/connect.server");
    const [{ data: txs }, { data: payouts }] = await Promise.all([
      supabaseAdmin
        .from("transactions")
        .select("affiliate_amount, status")
        .eq("affiliate_user_id", context.userId),
      supabaseAdmin
        .from("affiliate_payouts")
        .select("id, amount, currency, status, paid_at, created_at, error")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false }),
    ]);
    let earned = 0;
    let pending = 0;
    for (const t of txs ?? []) {
      const a = Number(t.affiliate_amount ?? 0);
      if (t.status === "released" || t.status === "completed") earned += a;
      else if (t.status === "held" || t.status === "disputed") pending += a;
    }
    let withdrawn = 0;
    let paid = 0;
    for (const p of payouts ?? []) {
      if (p.status === "processing" || p.status === "paid") withdrawn += Number(p.amount);
      if (p.status === "paid") paid += Number(p.amount);
    }
    return {
      pending: +pending.toFixed(2),
      available: +Math.max(earned - withdrawn, 0).toFixed(2),
      paid: +paid.toFixed(2),
      min: AFFILIATE_MIN_WITHDRAWAL_PLN,
      history: payouts ?? [],
    };
  });

/** Withdraws the whole available affiliate balance to the user's Stripe account. */
export const withdrawAffiliateBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => EnvSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    const { AFFILIATE_MIN_WITHDRAWAL_PLN } = await import("@/lib/connect.server");

    const { data: acct } = await supabaseAdmin
      .from("stripe_connect_accounts")
      .select("stripe_account_id, transfers_enabled")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .maybeSingle();
    if (!acct?.transfers_enabled) {
      return { error: "Najpierw połącz i zweryfikuj konto Stripe w zakładce Wypłaty." };
    }

    const { data: reserved, error: rErr } = await (supabaseAdmin as any).rpc(
      "reserve_affiliate_withdrawal",
      { _user_id: context.userId, _env: data.environment, _min: AFFILIATE_MIN_WITHDRAWAL_PLN },
    );
    const r = Array.isArray(reserved) ? reserved[0] : reserved;
    if (rErr || !r) return { error: rErr?.message ?? "Nie udało się przygotować wypłaty." };

    try {
      const stripe = createStripeClient(data.environment);
      const transfer = await stripe.transfers.create(
        {
          amount: Math.round(Number(r.amount) * 100),
          currency: "pln",
          destination: acct.stripe_account_id,
          metadata: { affiliatePayoutId: r.payout_id, userId: context.userId, kind: "affiliate" },
        },
        { idempotencyKey: `affiliate-payout-${r.payout_id}` },
      );
      await supabaseAdmin
        .from("affiliate_payouts")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_transfer_id: transfer.id,
        } as any)
        .eq("id", r.payout_id);
      return { ok: true, amount: Number(r.amount) };
    } catch (e) {
      const msg = getStripeErrorMessage(e);
      await supabaseAdmin
        .from("affiliate_payouts")
        .update({ status: "failed", error: msg.slice(0, 500) } as any)
        .eq("id", r.payout_id);
      return { error: msg };
    }
  });
