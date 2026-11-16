import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { trustedAppOrigin } from "./access-security";

const InputSchema = z.object({
  productId: z.string().uuid(),
  referralUserId: z.string().uuid().nullable().optional(),
  returnUrl: z.string().url().optional(),
  environment: z.enum(["sandbox", "live"]).optional(),
  /** Art. 38 pkt 13 — zgoda na dostarczenie treści cyfrowych przed terminem odstąpienia. */
  withdrawalWaiverAccepted: z.boolean().optional(),
  /** Metoda płatności wybrana przed checkoutem — od niej zależy opłata transakcyjna. */
  paymentMethod: z.enum(["blik", "card", "p24"]).optional(),
});

const PLATFORM_MARKUP_PCT = 10; // added on top of seller price -> buyer pays price * 1.10

/**
 * Only allow returning to this app's own origin. Uses the request origin as the
 * trusted base and keeps only the path of the caller-supplied URL.
 */
function safeReturnUrl(returnUrl: string | undefined, productId: string) {
  const req = getRequest();
  const headerOrigin = req?.headers.get("origin");
  let base: string | null = null;
  try {
    base = trustedAppOrigin(headerOrigin || req?.url || "");
  } catch {
    base = null;
  }
  const fallbackPath = `/product/${productId}`;
  if (!base) return fallbackPath;
  if (!returnUrl) return `${base}${fallbackPath}`;
  try {
    const u = new URL(returnUrl);
    if (u.origin !== base) return `${base}${fallbackPath}`;
    return `${base}${u.pathname}`;
  } catch {
    return `${base}${fallbackPath}`;
  }
}

/**
 * Escrow purchase flow:
 * - Seller sets `price` (NET) — what they receive.
 * - Buyer pays `price * 1.10`. The 10% markup is the platform cut.
 * - Free products: mark `released` immediately (no escrow needed).
 * - Paid products: create `pending` → Stripe Embedded Checkout →
 *   webhook flips to `held`. Funds stay in escrow until the buyer
 *   confirms delivery, which moves the row to `released`.
 */
type PurchaseInput = z.infer<typeof InputSchema>;

async function runPurchase(
  userId: string,
  data: PurchaseInput,
  extraMeta: Record<string, string> = {},
) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestMeta, writeAuditLog } = await import("@/lib/audit.server");
    const { computeLicenseHash } = await import("@/lib/license");
    const requestMeta = getRequestMeta();

    if (data.withdrawalWaiverAccepted !== true) {
      throw new Response(
        "Wymagana jest zgoda na dostarczenie treści cyfrowych przed upływem terminu do odstąpienia od umowy.",
        { status: 400 },
      );
    }

    let { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select(
        "id, seller_id, price, currency, status, downloads_count, title, affiliate_commission_pct",
      )
      .eq("id", data.productId)
      .maybeSingle();

    if (pErr) {
      const fallback = await supabaseAdmin
        .from("products")
        .select("id, seller_id, price, currency, status, downloads_count, title")
        .eq("id", data.productId)
        .maybeSingle();
      product = fallback.data as typeof product;
      pErr = fallback.error;
    }

    if (pErr || !product) throw new Response("Product not found", { status: 404 });
    if (product.status !== "published")
      throw new Response("Product not available", { status: 400 });
    if (product.seller_id === userId)
      throw new Response("Cannot purchase your own product", { status: 400 });

    // Reject duplicates — any successful state (paid, held, released, or legacy completed)
    const { data: existing } = await supabaseAdmin
      .from("transactions")
      .select("id, status")
      .eq("product_id", product.id)
      .eq("buyer_id", userId)
      .in("status", ["held", "released", "completed", "disputed"] as any)
      .limit(1)
      .maybeSingle();
    if (existing)
      return { transactionId: existing.id, status: existing.status as string, alreadyOwned: true };

    // Validate affiliate
    let affiliateUserId: string | null = null;
    let affiliatePct = 0;
    if (
      data.referralUserId &&
      data.referralUserId !== userId &&
      data.referralUserId !== product.seller_id &&
      (product.affiliate_commission_pct ?? 0) > 0
    ) {
      const { data: refProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", data.referralUserId)
        .maybeSingle();
      if (refProfile) {
        affiliateUserId = data.referralUserId;
        affiliatePct = Number(product.affiliate_commission_pct);
      }
    }

    const sellerNet = Number(product.price);
    const isFree = sellerNet === 0;
    const { buyerPriceOf } = await import("@/lib/pricing");
    // BLIK and Przelewy24 work only in PLN; other currencies are card-only.
    const isPln = String(product.currency ?? "PLN").toLowerCase() === "pln";
    const method = isPln ? (data.paymentMethod ?? "blik") : "card";
    // Buyer covers platform margin and the fee of the chosen payment method.
    const buyerPrice = buyerPriceOf(sellerNet, method);

    // Affiliate commission (a % of the seller's net price) is deducted from the
    // seller's cut. Platform keeps exactly 10% of the seller price; the rest of
    // the buyer surcharge covers the payment operator fee.
    const affiliateAmount = affiliateUserId ? +(sellerNet * (affiliatePct / 100)).toFixed(2) : 0;
    const sellerAmount = +Math.max(sellerNet - affiliateAmount, 0).toFixed(2);
    const platformAmount = +(sellerNet * (PLATFORM_MARKUP_PCT / 100)).toFixed(2);

    // New rows start `pending`; webhook promotes to `held` after payment.
    const status = isFree ? "released" : "pending";

    let { data: tx, error: tErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        product_id: product.id,
        buyer_id: userId,
        seller_id: product.seller_id,
        amount: buyerPrice, // what the buyer actually pays
        buyer_price: buyerPrice,
        currency: product.currency,
        status,
        affiliate_user_id: affiliateUserId,
        affiliate_commission_pct: affiliatePct,
        platform_amount: platformAmount,
        affiliate_amount: affiliateAmount,
        seller_amount: sellerAmount,
        released_at: isFree ? new Date().toISOString() : null,
      } as any)
      .select("id, status")
      .single();
    if (tErr) {
      const legacy = await supabaseAdmin
        .from("transactions")
        .insert({
          product_id: product.id,
          buyer_id: userId,
          seller_id: product.seller_id,
          amount: buyerPrice,
          currency: product.currency,
          status: isFree ? "completed" : "pending",
        } as any)
        .select("id, status")
        .single();
      tx = legacy.data;
      tErr = legacy.error;
    }
    if (tErr || !tx)
      throw new Response(tErr?.message ?? "Could not create transaction", { status: 500 });

    const licenseHash = await computeLicenseHash({
      transactionId: tx.id,
      productId: product.id,
      buyerId: userId,
      sellerId: product.seller_id,
      amount: buyerPrice,
      currency: String(product.currency ?? "PLN"),
    });

    await writeAuditLog(supabaseAdmin, {
      transactionId: tx.id,
      userId,
      listingId: product.id,
      eventType: "checkout",
      meta: requestMeta,
      withdrawalWaiverAccepted: true,
      licenseHash,
      checkoutAt: new Date().toISOString(),
    });

    if (isFree) {
      await supabaseAdmin
        .from("products")
        .update({ downloads_count: (product.downloads_count ?? 0) + 1 })
        .eq("id", product.id);
      return { transactionId: tx.id, status: "released" as const, alreadyOwned: false };
    }

    // ---- Stripe Embedded Checkout ----
    const env = data.environment ?? "sandbox";
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");

    const currency = String(product.currency ?? "PLN").toLowerCase();
    // Only the chosen method — the total was calculated for its fee.
    const paymentMethodTypes = [method];

    const { guest_email: guestEmail, ...metaRest } = extraMeta;
    extraMeta = metaRest;
    const baseParams = {
      mode: "payment" as const,
      ui_mode: "embedded_page" as const,
      // Keep the listing currency (PLN) so BLIK stays available.
      adaptive_pricing: { enabled: false },
      ...(guestEmail ? { customer_email: guestEmail } : {}),
      return_url: `${safeReturnUrl(data.returnUrl, data.productId)}?checkout=success${extraMeta.guest ? "&guest=1" : ""}&session_id={CHECKOUT_SESSION_ID}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: Math.round(buyerPrice * 100),
            product_data: { name: product.title },
          },
        },
      ],
      ...(method === "card"
        ? {
            payment_method_options: {
              // Wymuszenie silnego uwierzytelnienia (3D Secure) tam, gdzie to możliwe.
              card: { request_three_d_secure: "any" as const },
            },
          }
        : {}),
      payment_intent_data: {
        description: product.title,
        // Seller share is transferred to the creator's Stripe account on escrow release.
        transfer_group: tx.id,
        metadata: {
          transactionId: tx.id,
          productId: product.id,
          listing_id: product.id,
          user_id: userId,
          ip_address: requestMeta.ip ?? "",
          buyerId: userId,
          sellerId: product.seller_id,
          license_hash: licenseHash,
        },
      },
      metadata: {
        transactionId: tx.id,
        productId: product.id,
        listing_id: product.id,
        user_id: userId,
        ip_address: requestMeta.ip ?? "",
        buyerId: userId,
        withdrawal_waiver_accepted: "true",
        license_hash: licenseHash,
        payment_method: method,
        ...extraMeta,
      },
    };

    try {
      const stripe = createStripeClient(env);
      let session;
      try {
        session = await stripe.checkout.sessions.create({
          ...baseParams,
          payment_method_types: paymentMethodTypes as any,
        });
      } catch (methodError) {
        // Chosen method unavailable — don't switch silently (price depends on it).
        console.error("Stripe session (chosen method) failed:", methodError);
        await supabaseAdmin.from("transactions").delete().eq("id", tx.id);
        return {
          transactionId: tx.id,
          status: "failed" as const,
          alreadyOwned: false,
          error: getStripeErrorMessage(methodError),
        };
      }

      if (!session.client_secret) {
        await supabaseAdmin.from("transactions").delete().eq("id", tx.id);
        return {
          transactionId: tx.id,
          status: "pending" as const,
          alreadyOwned: false,
          error: "Stripe nie zwrócił danych sesji płatności.",
        };
      }

      // Persist Stripe session id for reconciliation
      const saved = await supabaseAdmin
        .from("transactions")
        .update({ stripe_session_id: session.id, stripe_env: env } as any)
        .eq("id", tx.id);
      if (saved.error) {
        await stripe.checkout.sessions.expire(session.id);
        throw saved.error;
      }

      return {
        transactionId: tx.id,
        status: "pending" as const,
        alreadyOwned: false,
        clientSecret: session.client_secret,
      };
    } catch (error) {
      // Roll back the pending row so the buyer can retry cleanly
      console.error("Stripe checkout error:", error);
      await supabaseAdmin.from("transactions").delete().eq("id", tx.id);
      return {
        transactionId: tx.id,
        status: "failed" as const,
        alreadyOwned: false,
        error: getStripeErrorMessage(error),
      };
    }
}

export const purchaseProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => runPurchase(context.userId, data));


const GuestInputSchema = InputSchema.extend({
  email: z.string().trim().toLowerCase().email().max(255),
  ageConsentAccepted: z.literal(true),
});

/**
 * Guest checkout: no registration and no email confirmation before paying.
 * The purchase is attached to the account for this email (created silently if new).
 * No session is returned — the buyer signs in via the emailed link to download.
 */
export const purchaseAsGuest = createServerFn({ method: "POST" })
  .inputValidator((input) => GuestInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { email, ageConsentAccepted: _a, ...purchase } = data;
    const { data: existingId } = await (supabaseAdmin as any).rpc("find_user_id_by_email", {
      _email: email,
    });
    let userId = existingId as string | null;
    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: { age_consent_accepted: true, passwordless_checkout: "true" },
      });
      if (error || !created.user) {
        const { data: again } = await (supabaseAdmin as any).rpc("find_user_id_by_email", { _email: email });
        if (!again) throw new Response("Nie udało się przygotować zakupu.", { status: 500 });
        userId = again as string;
      } else userId = created.user.id;
    }
    return runPurchase(userId!, purchase, { guest: "1", guest_email: email });
  });
