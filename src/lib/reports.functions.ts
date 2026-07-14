import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabaseAdmin: any, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw error;
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ status: z.enum(["pending", "reviewing", "resolved", "dismissed", "all"]).default("pending") }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    let q = supabaseAdmin.from("reports").select("*").order("created_at", { ascending: false });
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;

    const reporterIds = Array.from(new Set((rows ?? []).map((r: any) => r.reporter_id)));
    const productIds = (rows ?? []).filter((r: any) => r.target_type === "product").map((r: any) => r.target_id);
    const userTargetIds = (rows ?? []).filter((r: any) => r.target_type === "user").map((r: any) => r.target_id);
    const profileIds = Array.from(new Set([...reporterIds, ...userTargetIds]));

    const [{ data: profiles }, { data: products }] = await Promise.all([
      profileIds.length
        ? supabaseAdmin.from("profiles").select("id,display_name,username,is_banned").in("id", profileIds)
        : Promise.resolve({ data: [] as any[] }),
      productIds.length
        ? supabaseAdmin.from("products").select("id,title,status,seller_id").in("id", productIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const productMap = new Map((products ?? []).map((p: any) => [p.id, p]));

    return (rows ?? []).map((r: any) => ({
      ...r,
      reporter: profileMap.get(r.reporter_id) ?? null,
      product: r.target_type === "product" ? productMap.get(r.target_id) ?? null : null,
      user_target: r.target_type === "user" ? profileMap.get(r.target_id) ?? null : null,
    }));
  });

export const updateReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    reportId: z.string().uuid(),
    status: z.enum(["pending", "reviewing", "resolved", "dismissed"]),
    adminNotes: z.string().max(2000).nullable().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);
    const isFinal = data.status === "resolved" || data.status === "dismissed";
    const { error } = await supabaseAdmin.from("reports").update({
      status: data.status,
      admin_notes: data.adminNotes ?? null,
      resolved_at: isFinal ? new Date().toISOString() : null,
      resolved_by: isFinal ? context.userId : null,
    } as any).eq("id", data.reportId);
    if (error) throw error;
    return { ok: true };
  });

export const takedownProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    productId: z.string().uuid(),
    reason: z.string().max(2000).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    const { data: product, error: fetchErr } = await supabaseAdmin
      .from("products")
      .select("id, seller_id, title, file_path, preview_url, sample_url")
      .eq("id", data.productId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!product) throw new Response("Product not found", { status: 404 });

    if (product.file_path) {
      await supabaseAdmin.storage.from("product-files").remove([product.file_path]).catch(() => {});
    }
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

    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.productId);
    if (error) throw error;

    await supabaseAdmin.from("seller_notifications").insert({
      user_id: product.seller_id,
      kind: "product_rejected",
      product_title: product.title,
      admin_note: data.reason ?? "Zdjęte przez administratora",
    } as any);

    return { ok: true, deleted: true };
  });

export const setUserBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    userId: z.string().uuid(),
    banned: z.boolean(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Response("Nie możesz zablokować samego siebie", { status: 400 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    const { error: pErr } = await supabaseAdmin.from("profiles").update({ is_banned: data.banned } as any).eq("id", data.userId);
    if (pErr) throw pErr;

    try {
      await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        ban_duration: data.banned ? "876000h" : "none",
      } as any);
    } catch (e) {
      console.error("auth ban update failed", e);
    }

    if (data.banned) {
      await supabaseAdmin.from("products").update({ status: "archived" } as any).eq("seller_id", data.userId).eq("status", "published");
    }

    return { ok: true };
  });
