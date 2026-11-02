import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { isProductId } from "@/lib/product-links";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

export type ProductSeo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  preview_url: string | null;
};

/** Public SEO data for a published product (anon-readable rows only). */
export const getProductSeo = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().min(1).max(120).regex(/^[a-zA-Z0-9-]+$/) }).parse(input))
  .handler(async ({ data }): Promise<ProductSeo | null> => {
    try {
      const { data: row, error } = await publicClient()
        .from("products")
        .select("id, slug, title, description, price, currency, preview_url")
        .eq(isProductId(data.id) ? "id" : "slug", data.id)
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
  const out: { id: string; slug: string; updated_at: string }[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await client
      .from("products")
      .select("id, slug, updated_at")
      .eq("status", "published")
      .order("id")
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return out;
}
