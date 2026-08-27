import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const ProductInputSchema = z.object({ productId: z.string().uuid() });

async function getOptionalUserId(supabaseAdmin: any) {
  const authHeader = getRequest()?.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

async function isAdmin(supabaseAdmin: any, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export const getProductDetails = createServerFn({ method: "GET" })
  .inputValidator((input) => ProductInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let { data: product, error } = await supabaseAdmin
      .from("products")
      .select(
        "id, seller_id, category_id, title, description, price, currency, preview_url, sample_url, tags, status, is_tradable, license_terms, downloads_count, affiliate_commission_pct, created_at, updated_at, custom_category",
      )
      .eq("id", data.productId)
      .maybeSingle();

    if (error) {
      const fallback = await supabaseAdmin
        .from("products")
        .select(
          "id, seller_id, category_id, title, description, price, currency, preview_url, tags, status, is_tradable, downloads_count, created_at, updated_at",
        )
        .eq("id", data.productId)
        .maybeSingle();
      product = fallback.data as typeof product;
      error = fallback.error;
    }

    if (error) throw error;
    if (!product) return null;

    const userId = await getOptionalUserId(supabaseAdmin);

    // A listing the seller took down (`archived`) stays fully accessible to
    // everyone who already owns it — through purchase or an accepted exchange.
    let ownsProduct = false;
    if (userId) {
      const { data: tx } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("product_id", product.id)
        .eq("buyer_id", userId)
        .in("status", ["held", "released", "completed", "disputed"] as any)
        .limit(1)
        .maybeSingle();
      ownsProduct = Boolean(tx);
    }

    const allowed =
      product.status === "published" ||
      ownsProduct ||
      (userId && (product.seller_id === userId || (await isAdmin(supabaseAdmin, userId))));

    if (!allowed) return null;

    const [{ data: category }, { data: seller }] = await Promise.all([
      product.category_id
        ? supabaseAdmin
            .from("categories")
            .select("name")
            .eq("id", product.category_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabaseAdmin
        .from("profiles")
        .select("id, display_name, username, avatar_url, is_verified_seller")
        .eq("id", product.seller_id)
        .maybeSingle(),
    ]);

    return {
      ...product,
      category: category ?? null,
      seller: seller ?? null,
    };
  });
