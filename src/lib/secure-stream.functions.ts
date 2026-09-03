import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({ productId: z.string().uuid() });

/**
 * Returns a short-lived (1h) signed URL for the product's main file.
 * Authorized only for: the seller, or a buyer with a completed transaction.
 */
export const getSecureStreamUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, seller_id, file_path, file_paths, title")
      .eq("id", data.productId)
      .maybeSingle();

    if (pErr || !product) {
      throw new Response("Product not found", { status: 404 });
    }
    const filePaths: string[] = Array.from(
      new Set(
        [product.file_path, ...(((product as any).file_paths as string[] | null) ?? [])].filter(
          (path): path is string => typeof path === "string" && path.length > 0,
        ),
      ),
    );
    if (filePaths.length === 0) {
      throw new Response("No file attached", { status: 404 });
    }

    const isOwner = product.seller_id === userId;

    if (!isOwner) {
      let { data: tx, error: txErr } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("product_id", product.id)
        .eq("buyer_id", userId)
        .in("status", ["held", "released", "completed", "disputed"])
        .limit(1)
        .maybeSingle();
      if (txErr) {
        const legacy = await supabaseAdmin
          .from("transactions")
          .select("id")
          .eq("product_id", product.id)
          .eq("buyer_id", userId)
          .eq("status", "completed")
          .limit(1)
          .maybeSingle();
        tx = legacy.data;
        txErr = legacy.error;
      }

      if (txErr || !tx) {
        throw new Response("Forbidden — purchase required", { status: 403 });
      }
    }

    // Derive a friendly filename with the correct extension
    const rawExt = filePaths[0].includes(".")
      ? filePaths[0].substring(filePaths[0].lastIndexOf("."))
      : "";
    const safeTitle = (product.title || "plik").replace(/[^\w\-. ]+/g, "_").slice(0, 80) || "plik";
    const downloadName = safeTitle + rawExt;
    const downloads = await Promise.all(
      filePaths.map(async (path, index) => {
        const extension = path.includes(".") ? path.substring(path.lastIndexOf(".")) : "";
        const name = index === 0 ? downloadName : `${safeTitle}-${index + 1}${extension}`;
        const { data: signed, error } = await supabaseAdmin.storage
          .from("product-files")
          .createSignedUrl(path, 60 * 60, { download: name });
        if (error || !signed) throw new Response("Could not sign URL", { status: 500 });
        return { url: signed.signedUrl, name };
      }),
    );

    const [{ data: streamSigned, error: sErr }, { data: dlSigned, error: dErr }] =
      await Promise.all([
        supabaseAdmin.storage.from("product-files").createSignedUrl(filePaths[0], 60 * 60),
        supabaseAdmin.storage
          .from("product-files")
          .createSignedUrl(filePaths[0], 60 * 60, { download: downloadName }),
      ]);

    if (sErr || !streamSigned || dErr || !dlSigned) {
      throw new Response("Could not sign URL", { status: 500 });
    }

    return {
      url: streamSigned.signedUrl,
      downloadUrl: dlSigned.signedUrl,
      downloadName,
      downloads,
      expiresAt: Date.now() + 60 * 60 * 1000,
      title: product.title,
    };
  });
