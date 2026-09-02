import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getAvatarUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ filename: z.string().min(1).max(180), contentType: z.string().min(1).max(120) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext =
      (data.filename.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 8) || "jpg";
    const path = `${context.userId}/${Date.now()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("avatars")
      .createSignedUploadUrl(path);
    if (error || !signed)
      throw new Response(error?.message ?? "Nie udało się przygotować wgrywania zdjęcia", {
        status: 500,
      });
    const publicUrl = supabaseAdmin.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    return { path, token: signed.token, signedUrl: signed.signedUrl, publicUrl };
  });
