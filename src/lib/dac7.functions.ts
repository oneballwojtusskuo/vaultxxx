import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { dac7Status, ownerThresholdStatus } from "@/lib/dac7.server";

const SELLER_TX_STATUSES = ["held", "released", "completed"] as const;

function currentYearRange() {
  const now = new Date();
  const year = now.getFullYear();
  return {
    year,
    start: new Date(Date.UTC(year, 0, 1)).toISOString(),
    end: new Date(Date.UTC(year + 1, 0, 1)).toISOString(),
  };
}

/** Returns the caller's DAC7 threshold status for the current calendar year plus tax-profile completeness. */
export const getMyDac7Status = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { start, end } = currentYearRange();

    const { data: txs, error } = await supabaseAdmin
      .from("transactions")
      .select("id, seller_amount, status, created_at")
      .eq("seller_id", userId)
      .in("status", SELLER_TX_STATUSES as unknown as any)
      .gte("created_at", start)
      .lt("created_at", end);
    if (error) throw new Response(error.message, { status: 500 });

    const txCount = txs?.length ?? 0;
    const grossPln = (txs ?? []).reduce((s, t: any) => s + Number(t.seller_amount ?? 0), 0);
    const status = dac7Status(txCount, grossPln);

    const { data: profile } = await supabaseAdmin
      .from("seller_tax_profiles")
      .select("user_id, seller_kind, full_name, address_line, city, postal_code, tin, verified")
      .eq("user_id", userId)
      .maybeSingle();

    const hasProfile = Boolean(profile);
    const complete = Boolean(
      profile?.full_name && profile?.address_line && profile?.city && profile?.postal_code && profile?.tin,
    );

    return { ...status, hasProfile, complete };
  });

const TaxProfileInputSchema = z
  .object({
    sellerKind: z.enum(["private", "business"]),
    fullName: z.string().trim().min(3, "Podaj imię i nazwisko / nazwę firmy"),
    addressLine: z.string().trim().min(3, "Podaj adres"),
    city: z.string().trim().min(2, "Podaj miejscowość"),
    postalCode: z.string().trim().min(3, "Podaj kod pocztowy"),
    country: z.string().trim().min(2).default("PL"),
    tin: z
      .string()
      .trim()
      .regex(/^\d{10,11}$/, "Podaj poprawny NIP (10 cyfr) lub PESEL (11 cyfr)"),
    dateOfBirth: z.string().trim().optional().nullable(),
    birthPlace: z.string().trim().optional().nullable(),
    vatId: z.string().trim().optional().nullable(),
    businessRegNo: z.string().trim().optional().nullable(),
  })
  .refine((v) => v.sellerKind === "private" || Boolean(v.businessRegNo), {
    message: "Podaj numer NIP/wpisu do CEIDG dla działalności gospodarczej",
    path: ["businessRegNo"],
  });

/** Upserts the caller's tax profile, used for DAC7 reporting to tax authorities. */
export const saveTaxProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TaxProfileInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("seller_tax_profiles")
      .upsert(
        {
          user_id: userId,
          seller_kind: data.sellerKind,
          full_name: data.fullName,
          address_line: data.addressLine,
          city: data.city,
          postal_code: data.postalCode,
          country: data.country || "PL",
          tin: data.tin,
          date_of_birth: data.dateOfBirth || null,
          birth_place: data.birthPlace || null,
          vat_id: data.vatId || null,
          business_reg_no: data.businessRegNo || null,
        } as any,
        { onConflict: "user_id" },
      );
    if (error) throw new Response(error.message, { status: 500 });

    return { ok: true };
  });

function quarterRange(date: Date) {
  const q = Math.floor(date.getUTCMonth() / 3);
  const start = new Date(Date.UTC(date.getUTCFullYear(), q * 3, 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), q * 3 + 3, 1));
  return { start, end, quarter: q + 1, year: date.getUTCFullYear() };
}

/** Admin-only: platform commission revenue broken down by quarter/month/year plus unregistered-activity threshold status. */
export const getOwnerRevenueStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAdminClientForContext } = await import("@/lib/admin-auth.server");
    const supabaseAdmin = await getAdminClientForContext(context);

    const now = new Date();
    const twelveMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

    const { data: txs, error } = await supabaseAdmin
      .from("transactions")
      .select("platform_amount, status, created_at")
      .in("status", ["held", "released", "completed"])
      .gte("created_at", twelveMonthsAgo.toISOString());
    if (error) throw new Response(error.message, { status: 500 });

    const rows = txs ?? [];
    const { start: qStart, end: qEnd, quarter, year: qYear } = quarterRange(now);

    const quarterRevenue = rows
      .filter((t: any) => {
        const d = new Date(t.created_at);
        return d >= qStart && d < qEnd;
      })
      .reduce((s: number, t: any) => s + Number(t.platform_amount ?? 0), 0);

    const months: { month: string; revenuePln: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const mEnd = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1));
      const revenuePln = rows
        .filter((t: any) => {
          const d = new Date(t.created_at);
          return d >= m && d < mEnd;
        })
        .reduce((s: number, t: any) => s + Number(t.platform_amount ?? 0), 0);
      months.push({ month: m.toISOString().slice(0, 7), revenuePln });
    }

    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const { data: yearTxs } = await supabaseAdmin
      .from("transactions")
      .select("platform_amount, status, created_at")
      .in("status", ["held", "released", "completed"])
      .gte("created_at", yearStart.toISOString());
    const yearRevenue = (yearTxs ?? []).reduce((s: number, t: any) => s + Number(t.platform_amount ?? 0), 0);

    return {
      quarter,
      quarterYear: qYear,
      quarterRevenuePln: quarterRevenue,
      months,
      yearRevenuePln: yearRevenue,
      threshold: ownerThresholdStatus(quarterRevenue),
    };
  });
