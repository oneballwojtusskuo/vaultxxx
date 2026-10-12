import { supabase } from "@/lib/supabase-browser";
import { getAvatarUploadUrl } from "@/lib/avatar.functions";

/** Uploads an avatar via a server-issued signed URL (no client storage read rights needed). */
export async function uploadAvatarFile(file: File): Promise<{ path: string; publicUrl: string }> {
  const signed = await getAvatarUploadUrl({
    data: { filename: file.name || "avatar.jpg", contentType: file.type || "image/jpeg" },
  });
  const { error } = await supabase.storage
    .from("avatars")
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
  if (error) throw error;
  return { path: signed.path, publicUrl: signed.publicUrl };
}
