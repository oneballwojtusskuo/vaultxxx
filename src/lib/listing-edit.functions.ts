import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { listingEditSchema, assertListingOwner, assertListingFiles, needsListingReview } from "./listing-edit";

export const getEditableListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ productId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: product, error } = await supabaseAdmin.from("products")
      .select("id,title,description,price,category_id,custom_category,tags,is_tradable,affiliate_commission_pct,preview_url,sample_url,file_path,file_paths,license_terms,status,updated_at")
      .eq("id", data.productId).eq("seller_id", context.userId).maybeSingle();
    if (error || !product) throw new Error("Ogłoszenie nie istnieje lub nie należy do Ciebie.");
    return product;
  });

export const updateOwnListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listingEditSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: previous, error } = await supabaseAdmin.from("products").select("*")
      .eq("id", data.productId).eq("seller_id", context.userId).maybeSingle();
    if (error || !previous) throw new Error("Ogłoszenie nie istnieje lub nie należy do Ciebie.");
    assertListingOwner(previous.seller_id, context.userId);
    assertListingFiles(data.file_paths, context.userId);
    if (previous.status === "sold") throw new Error("Sprzedane ogłoszenie nie może być edytowane.");
    const { productId, ...fields } = data;
    for (const url of [fields.preview_url, fields.sample_url]) {
      if (!url) continue;
      // Only existing media or newly uploaded, seller-owned public previews.
      if (url === previous.preview_url || url === previous.sample_url) continue;
      const base = new URL(supabaseAdmin.storage.from("product-previews").getPublicUrl(`${context.userId}/`).data.publicUrl);
      const candidate = new URL(url);
      if (candidate.origin !== base.origin || !candidate.pathname.startsWith(base.pathname) || candidate.search || candidate.hash || !isSafePublicPath(candidate.pathname, context.userId)) {
        throw new Error("Nieprawidłowa okładka lub próbka.");
      }
    }
    const { data: category } = await context.supabase.from("categories").select("slug").eq("id", fields.category_id).maybeSingle();
    if (!category) throw new Error("Wybierz poprawną kategorię.");
    if (category.slug === "other" && (fields.custom_category?.length ?? 0) < 3) throw new Error("Podaj własną kategorię (minimum 3 znaki).");
    const fileChanged = JSON.stringify(previous.file_paths) !== JSON.stringify(fields.file_paths);
    if (fileChanged) {
      const { scanProductFiles } = await import("@/lib/malware-scan.server");
      const scan = await scanProductFiles(supabaseAdmin, { paths: fields.file_paths, title: fields.title, description: fields.description });
      if (scan.verdict !== "clean") throw new Error("Nowe pliki nie przeszły kontroli bezpieczeństwa. Dotychczasowe pliki pozostają bez zmian.");
    }
    const reviewRequired = needsListingReview(previous, fields);
    const { data: saved, error: saveError } = await supabaseAdmin.from("products").update({
      ...fields,
      file_path: fields.file_paths[0],
      ...(reviewRequired ? { status: "pending_review" as const, reviewed_at: null, reviewed_by: null, review_notes: null } : {}),
      ...(fileChanged ? { malware_scan_status: "pending", malware_scan_notes: null, malware_scanned_at: null, ai_review_status: null, ai_review_notes: null } : {}),
    }).eq("id", productId).eq("seller_id", context.userId).eq("updated_at", previous.updated_at).select("id,status").maybeSingle();
    if (saveError) throw new Error(saveError.message);
    if (!saved) throw new Error("Ogłoszenie zmieniło się w międzyczasie. Odśwież formularz.");
    return { ...saved, reviewRequired };
  });

function isSafePublicPath(path: string, userId: string) {
  const prefix = `/storage/v1/object/public/product-previews/`;
  if (!path.startsWith(prefix)) return false;
  try {
    const relative = decodeURIComponent(path.slice(prefix.length));
    return relative.startsWith(`${userId}/`) && !relative.includes("..") && !relative.includes("\\");
  } catch { return false; }
}