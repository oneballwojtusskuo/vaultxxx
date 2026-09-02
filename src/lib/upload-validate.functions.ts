import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  bucket: z.enum(["product-previews", "product-files", "avatars"]),
  path: z.string().min(1).max(512),
  kind: z.enum(["image", "any"]).default("image"),
});

// Allowed magic-byte signatures for images.
// Each entry: [offset, bytes]
const IMAGE_SIGNATURES: Array<{ offset: number; bytes: number[] }> = [
  { offset: 0, bytes: [0xff, 0xd8, 0xff] }, // JPEG
  { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
  { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF
  { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (WebP container)
];

function matchesAny(buf: Uint8Array, sigs: typeof IMAGE_SIGNATURES) {
  return sigs.some(
    (s) =>
      buf.length >= s.offset + s.bytes.length && s.bytes.every((b, i) => buf[s.offset + i] === b),
  );
}

/**
 * Verifies a file just uploaded to storage by inspecting its magic bytes
 * with the service-role client. If the file is not a valid image (when
 * kind=image) or has a forbidden MIME type, the object is deleted and an
 * error is thrown.
 *
 * This protects against the HTML/SVG-in-public-bucket content injection /
 * phishing vector — the client-supplied `accept` and Content-Type headers
 * are not trusted; the server re-checks the bytes.
 */
export const validateUploadedFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // The convention used by sell.tsx and the profile flow is that uploaded
    // paths always start with `<user-id>/`. Enforce that so users cannot
    // ask the server to validate (or delete) files owned by other users.
    if (!data.path.startsWith(`${userId}/`)) {
      throw new Response("Forbidden", { status: 403 });
    }

    const { data: blob, error: dErr } = await supabaseAdmin.storage
      .from(data.bucket)
      .download(data.path);

    if (dErr || !blob) {
      throw new Response("Uploaded file not found", { status: 404 });
    }

    const buf = new Uint8Array(await blob.slice(0, 32).arrayBuffer());

    // Always reject obviously dangerous payloads regardless of kind.
    // SVG starts with `<svg` or `<?xml`; HTML with `<!DOCTYPE` or `<html`.
    const head = new TextDecoder("utf-8", { fatal: false }).decode(buf).trim().toLowerCase();
    const isMarkup =
      head.startsWith("<svg") ||
      head.startsWith("<?xml") ||
      head.startsWith("<!doctype") ||
      head.startsWith("<html") ||
      head.startsWith("<script");

    let ok = !isMarkup;
    if (ok && data.kind === "image") {
      ok = matchesAny(buf, IMAGE_SIGNATURES);
    }

    if (!ok) {
      await supabaseAdmin.storage.from(data.bucket).remove([data.path]);
      throw new Response("File type not allowed", { status: 400 });
    }

    return { ok: true };
  });
