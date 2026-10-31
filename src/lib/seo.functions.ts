import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type ProductSeo = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  preview_url: string | null;
};

/** Public SEO data for a published product (anon-readable rows only). */
export const getProductSeo = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<ProductSeo | null> => {
    try {
      const { data: row, error } = await publicClient()
        .from("products")
        .select("id, title, description, price, currency, preview_url")
        .eq("id", data.id)
        .eq("status", "published")
        .maybeSingle();
      if (error) console.error("[seo]", error.message);
      return (row as ProductSeo) ?? null;
    } catch (e) {
      console.error("[seo]", e);
      return null;
    }
  });

/** All published products for the sitemap, paginated. Throws on failure. */
export async function listPublishedProductsForSitemap() {
  const client = publicClient();
  const out: { id: string; updated_at: string }[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await client
      .from("products")
      .select("id, updated_at")
      .eq("status", "published")
      .order("id")
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return out;
}
