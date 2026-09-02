import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const RequestSchema = z.object({
  kind: z.enum(["export", "rectification", "erasure", "restriction", "objection", "portability"]),
  details: z.string().trim().max(2000).optional(),
});

/** RODO art. 15/20 — full copy of the user's own data, as JSON. */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    // Own profile row (incl. date_of_birth, which is not readable via the public column grants)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      profile,
      products,
      purchases,
      sales,
      reviews,
      consents,
      cookies,
      privacyRequests,
      payout,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("products").select("*").eq("seller_id", userId),
      supabase.from("transactions").select("*").eq("buyer_id", userId),
      supabase.from("transactions").select("*").eq("seller_id", userId),
      supabase.from("reviews").select("*").eq("buyer_id", userId),
      supabase.from("consents").select("*").eq("user_id", userId),
      supabase.from("cookie_consents").select("*").eq("user_id", userId),
      supabase.from("privacy_requests").select("*").eq("user_id", userId),
      supabase
        .from("seller_payouts")
        .select("payout_holder, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      account: {
        id: userId,
        email: (claims as { email?: string })?.email ?? null,
      },
      profile: profile.data ?? null,
      products: products.data ?? [],
      purchases: purchases.data ?? [],
      sales: sales.data ?? [],
      reviews: reviews.data ?? [],
      consents: consents.data ?? [],
      cookieConsents: cookies.data ?? [],
      privacyRequests: privacyRequests.data ?? [],
      payoutAccount: payout.data ?? null,
    };
  });

/** Registers a formal RODO request (art. 16-21) for admin handling. */
export const createPrivacyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("privacy_requests")
      .insert({ user_id: context.userId, kind: data.kind, details: data.details ?? null })
      .select("id, kind, status, created_at")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    return row;
  });

export const getMyPrivacyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("privacy_requests")
      .select("id, kind, status, details, admin_notes, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });
