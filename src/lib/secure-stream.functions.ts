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
    const { supabase, userId } = context;

    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id, seller_id, file_path, title")
      .eq("id", data.productId)
      .maybeSingle();

    if (pErr || !product) {
      throw new Response("Product not found", { status: 404 });
    }
    if (!product.file_path) {
      throw new Response("No file attached", { status: 404 });
    }

    const isOwner = product.seller_id === userId;

    if (!isOwner) {
      const { data: tx } = await supabase
        .from("transactions")
        .select("id")
        .eq("product_id", product.id)
        .eq("buyer_id", userId)
        .in("status", ["held", "released", "completed", "disputed"])
        .limit(1)
        .maybeSingle();

      if (!tx) {
        throw new Response("Forbidden — purchase required", { status: 403 });
      }
    }

    const { data: signed, error: sErr } = await supabase.storage
      .from("product-files")
      .createSignedUrl(product.file_path, 60 * 60); // 1h

    if (sErr || !signed) {
      throw new Response("Could not sign URL", { status: 500 });
    }

    return { url: signed.signedUrl, expiresAt: Date.now() + 60 * 60 * 1000, title: product.title };
  });
