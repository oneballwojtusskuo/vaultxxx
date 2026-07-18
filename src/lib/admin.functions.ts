import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AdminProductsInputSchema = z.object({
  filter: z.enum(["pending_review", "published", "rejected", "all"]),
});

const ModerateProductInputSchema = z.object({
  productId: z.string().uuid(),
  status: z.enum(["published", "rejected"]),
  reviewNotes: z.string().max(2000).nullable().optional(),
});

const ProductFileInputSchema = z.object({ productId: z.string().uuid() });
const OWNER_ADMIN_EMAIL = "chujcinaryjsuko@gmail.com";

function getClaimEmail(claims: unknown) {
  const c = claims as { email?: unknown; user_metadata?: { email?: unknown } };
  const email = typeof c.email === "string" ? c.email : c.user_metadata?.email;
  return typeof email === "string" ? email.toLowerCase() : "";
}

function assertOwnerEmail(claims: unknown) {
  if (getClaimEmail(claims) !== OWNER_ADMIN_EMAIL) {
    throw new Response("Forbidden", { status: 403 });
  }
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Response("Forbidden", { status: 403 });
}

/**
 * Bootstrap: if there is no admin yet, promote the current user to admin.
 * After the first admin exists, this becomes a no-op.
 */
export const claimAdminIfNone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertOwnerEmail(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context;

    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw cErr;

    if ((count ?? 0) > 0) return { claimed: false, alreadyHasAdmin: true };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) throw error;
    return { claimed: true };
  });

/** Check whether the calling user is an admin. */
export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw error;
    if (data) return { isAdmin: true };

    if (getClaimEmail(context.claims) !== OWNER_ADMIN_EMAIL) {
      return { isAdmin: false };
    }

    // Owner bootstrap: verified auth email creates a real DB role, then future checks stay DB-driven.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upsertError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (upsertError) throw upsertError;

    return { isAdmin: true };
  });

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AdminProductsInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("products")
      .select("id,title,description,price,currency,status,created_at,preview_url,sample_url,file_path,seller_id,tags,review_notes")
      .order("created_at", { ascending: false });

    if (data.filter !== "all") query = query.eq("status", data.filter);

    const { data: products, error } = await query;
    if (error) throw error;

    return (products ?? []).map((product: any) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      status: product.status,
      created_at: product.created_at,
      preview_url: product.preview_url,
      sample_url: product.sample_url,
      seller_id: product.seller_id,
      tags: product.tags,
      review_notes: product.review_notes,
      has_file: Boolean(product.file_path),
    }));
  });

export const moderateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ModerateProductInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.status === "rejected") {
      // Permanent removal: fetch product to know owner + storage paths, delete files, delete row, notify seller.
      const { data: product, error: fetchErr } = await supabaseAdmin
        .from("products")
        .select("id, seller_id, title, file_path, preview_url, sample_url")
        .eq("id", data.productId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!product) throw new Response("Product not found", { status: 404 });

      // Delete main product file (private bucket, stored as path).
      if (product.file_path) {
        await supabaseAdmin.storage.from("product-files").remove([product.file_path]).catch(() => {});
      }
      // Delete public preview/sample by extracting object path from public URL.
      const publicPaths: string[] = [];
      const extract = (url: string | null) => {
        if (!url) return;
        const marker = "/product-previews/";
        const idx = url.indexOf(marker);
        if (idx >= 0) publicPaths.push(url.substring(idx + marker.length));
      };
      extract(product.preview_url);
      extract(product.sample_url);
      if (publicPaths.length) {
        await supabaseAdmin.storage.from("product-previews").remove(publicPaths).catch(() => {});
      }

      const { error: delErr } = await supabaseAdmin.from("products").delete().eq("id", data.productId);
      if (delErr) throw delErr;

      await supabaseAdmin.from("seller_notifications").insert({
        user_id: product.seller_id,
        kind: "product_rejected",
        product_title: product.title,
        admin_note: data.reviewNotes ?? null,
      } as any);

      return { ok: true, deleted: true };
    }

    const { error } = await supabaseAdmin
      .from("products")
      .update({
        status: data.status,
        review_notes: data.reviewNotes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      } as any)
      .eq("id", data.productId);
    if (error) throw error;

    return { ok: true };
  });

export const getAdminProductFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProductFileInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("file_path")
      .eq("id", data.productId)
      .maybeSingle();
    if (error) throw error;
    if (!product?.file_path) throw new Response("No file attached", { status: 404 });

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("product-files")
      .createSignedUrl(product.file_path, 60 * 30);
    if (signError || !signed) throw new Response("Could not sign file", { status: 500 });

    return { url: signed.signedUrl };
  });
