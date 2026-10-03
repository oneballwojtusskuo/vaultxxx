import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  productId: z.string().uuid(),
  referralUserId: z.string().uuid().nullable().optional(),
  returnUrl: z.string().url().optional(),
  environment: z.enum(["sandbox", "live"]).optional(),
  /** Art. 38 pkt 13 — zgoda na dostarczenie treści cyfrowych przed terminem odstąpienia. */
  withdrawalWaiverAccepted: z.boolean().optional(),
});

const PLATFORM_MARKUP_PCT = 10; // added on top of seller price -> buyer pays price * 1.10

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
    const buyerPrice = +(sellerNet * (1 + PLATFORM_MARKUP_PCT / 100)).toFixed(2);

    // Platform keeps its full 10% markup. Affiliate commission (a % of the
    // seller's net price) is deducted from the seller's cut.
    const affiliateAmount = affiliateUserId ? +(sellerNet * (affiliatePct / 100)).toFixed(2) : 0;
    const sellerAmount = +Math.max(sellerNet - affiliateAmount, 0).toFixed(2);
    const platformAmount = +(buyerPrice - sellerNet).toFixed(2);

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
    const stripe = createStripeClient(env);

    const currency = String(product.currency ?? "PLN").toLowerCase();
    // BLIK requires PLN. Promote BLIK first for Polish currency; fall back to card + p24 otherwise.
    const paymentMethodTypes =
      currency === "pln" ? (["blik", "card", "p24"] as const) : (["card"] as const);

    const { guest_email: guestEmail, ...metaRest } = extraMeta;
    extraMeta = metaRest;
    const baseParams = {
      mode: "payment" as const,
      ui_mode: "embedded_page" as const,
      // Keep the listing currency (PLN) so BLIK stays available.
      adaptive_pricing: { enabled: false },
      ...(guestEmail ? { customer_email: guestEmail } : {}),
      return_url: `${data.returnUrl ?? ""}?checkout=success${extraMeta.guest ? "&guest=1" : ""}&session_id={CHECKOUT_SESSION_ID}`,
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
      payment_method_options: {
        // Wymuszenie silnego uwierzytelnienia (3D Secure) tam, gdzie to możliwe.
        card: { request_three_d_secure: "any" as const },
      },
      payment_intent_data: {
        description: product.title,
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
        ...extraMeta,
      },
    };

    try {
      let session;
      try {
        session = await stripe.checkout.sessions.create({
          ...baseParams,
          payment_method_types: paymentMethodTypes as any,
        });
      } catch (methodError) {
        // BLIK/P24 may not be activated on the account — retry with Stripe's
        // automatic payment methods so checkout still opens.
        console.error("Stripe session (explicit methods) failed:", methodError);
        session = await stripe.checkout.sessions.create(baseParams);
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
      await supabaseAdmin
        .from("transactions")
        .update({ stripe_session_id: session.id } as any)
        .eq("id", tx.id);

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

const GuestSchema = InputSchema.extend({
  email: z.string().trim().toLowerCase().email().max(255),
  ageConsentAccepted: z.literal(true),
});

/**
 * Zakup bez konta: znajduje lub zakłada konto dla podanego e-maila i
 * uruchamia ten sam przepływ escrow co dla zalogowanych.
 * Istniejące konta NIGDY nie są logowane automatycznie (ochrona przed
 * przejęciem konta) — dostają link logowania na e-mail.
 */
export const purchaseProductGuest = createServerFn({ method: "POST" })
  .inputValidator((input) => GuestSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId: string | null = null;
    let isNew = false;
    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      user_metadata: { age_consent_accepted: "true", guest_checkout: "true" },
    });
    if (created.data?.user) {
      userId = created.data.user.id;
      isNew = true;
    } else {
      const link = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: data.email,
      });
      userId = link.data?.user?.id ?? null;
    }
    if (!userId) {
      return { status: "failed" as const, error: "Nie udało się przygotować konta dla tego e-maila." };
    }
    const { data: banned } = await supabaseAdmin
      .from("profiles")
      .select("is_banned")
      .eq("id", userId)
      .maybeSingle();
    if ((banned as any)?.is_banned) {
      return { status: "failed" as const, error: "To konto jest zablokowane." };
    }

    const { email: _e, ageConsentAccepted: _a, ...rest } = data;
    const res: any = await runPurchase(userId, rest, {
      guest: "true",
      guest_new: isNew ? "1" : "0",
      guest_email: data.email,
    });

    // Darmowy produkt: od razu logowanie (tylko nowe konto) albo link e-mail.
    if (res.status === "released" && !res.alreadyOwned) {
      if (isNew) {
        const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: data.email });
        return { ...res, isNew, tokenHash: link.data?.properties?.hashed_token ?? null };
      }
      return { ...res, isNew };
    }
    return { ...res, isNew };
  });

/** Po powrocie z płatności gościa: loguje nowe konto lub każe wysłać link e-mail. */
export const finalizeGuestCheckout = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({ sessionId: z.string().min(10).max(255), environment: z.enum(["sandbox", "live"]) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { createStripeClient } = await import("@/lib/stripe.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      const md = session.metadata ?? {};
      if (md.guest !== "true" || !md.buyerId) return { mode: "none" as const };
      if (Date.now() / 1000 - session.created > 2 * 60 * 60) return { mode: "none" as const };
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(md.buyerId);
      const email = u?.user?.email;
      if (!email) return { mode: "none" as const };
      const paid = session.payment_status === "paid";
      // Automatyczne logowanie tylko dla świeżo założonego konta, które
      // nigdy się nie logowało — inaczej link logowania idzie na e-mail.
      if (md.guest_new === "1" && !u.user?.last_sign_in_at) {
        const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
        const tokenHash = link.data?.properties?.hashed_token;
        if (tokenHash) return { mode: "login" as const, tokenHash, paid, email };
      }
      return { mode: "email" as const, email, paid };
    } catch (e: any) {
      return { mode: "none" as const, error: e?.message ?? "Błąd" };
    }
  });
