import { createFileRoute } from "@tanstack/react-router";
import { verifyDownloadToken } from "@/lib/download-token";
import { isSellerFile } from "@/lib/access-security";
import { OPERATOR_CONTACT } from "@/lib/operator";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const page = (title: string, body: string, status = 200) =>
  new Response(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | vlnd</title><style>body{font-family:Arial,sans-serif;background:#faf6ef;color:#2a2233;display:flex;justify-content:center;padding:40px 16px}main{background:#fff;border-radius:16px;padding:28px;max-width:480px;width:100%}a.b{display:block;background:#6d4aa8;color:#fff;text-align:center;padding:14px;border-radius:10px;font-weight:700;text-decoration:none;margin:10px 0}</style></head><body><main><h1 style="font-size:22px">${esc(title)}</h1>${body}</main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });

export const Route = createFileRoute("/api/public/download/")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.DOWNLOAD_LINK_SECRET;
        const token = new URL(request.url).searchParams.get("t") ?? "";
        const txId = secret ? await verifyDownloadToken(secret, token) : null;
        const invalid = () => page("Link jest nieprawidłowy", `<p>Ten link do pobrania jest nieprawidłowy lub zakup nie jest już aktywny. Napisz na ${OPERATOR_CONTACT} — pomożemy.</p>`, 403);
        if (!txId) return invalid();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: tx } = await supabaseAdmin.from("transactions").select("id, product_id, buyer_id, status")
          .eq("id", txId).maybeSingle();
        if (!tx || !tx.product_id || !["held", "released", "completed", "disputed"].includes(tx.status)) return invalid();
        const { data: product } = await supabaseAdmin.from("products")
          .select("id, seller_id, file_path, file_paths, title").eq("id", tx.product_id).maybeSingle();
        if (!product) return invalid();
        const paths = Array.from(new Set([product.file_path, ...(((product as any).file_paths as string[] | null) ?? [])]
          .filter((p): p is string => typeof p === "string" && isSellerFile(p, product.seller_id))));
        if (!paths.length) return page("Brak pliku", `<p>Plik jest chwilowo niedostępny. Napisz na ${OPERATOR_CONTACT}.</p>`, 404);
        const safe = (product.title || "plik").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[łŁ]/g, (c) => (c === "ł" ? "l" : "L")).replace(/[^\w\-. ]+/g, "").trim().slice(0, 80) || "plik";
        const links = await Promise.all(paths.map(async (path, i) => {
          const ext = path.includes(".") ? path.substring(path.lastIndexOf(".")) : "";
          const name = i === 0 ? safe + ext : `${safe}-${i + 1}${ext}`;
          const { data } = await supabaseAdmin.storage.from("product-files").createSignedUrl(path, 60 * 30, { download: name });
          return data ? { url: data.signedUrl, name } : null;
        }));
        const ok = links.filter((l): l is { url: string; name: string } => !!l);
        if (!ok.length) return page("Błąd", `<p>Nie udało się przygotować pliku. Spróbuj ponownie za chwilę.</p>`, 500);
        if (tx.buyer_id) {
          const { getRequestMeta, writeAuditLog } = await import("@/lib/audit.server");
          await writeAuditLog(supabaseAdmin, { transactionId: tx.id, userId: tx.buyer_id, listingId: product.id,
            eventType: "download", meta: getRequestMeta(), downloadedAt: new Date().toISOString() });
        }
        if (ok.length === 1) return new Response(null, { status: 302, headers: { location: ok[0].url, "cache-control": "no-store" } });
        return page(product.title || "Twoje pliki", `<p>Kliknij, żeby pobrać:</p>${ok.map((l) => `<a class="b" href="${esc(l.url)}">${esc(l.name)}</a>`).join("")}<p style="font-size:13px;color:#6b6475">Nic się nie dzieje? Jeśli jesteś w Instagramie lub Facebooku, stuknij ⋯ w rogu i wybierz „Otwórz w przeglądarce”. Ten sam link masz też w e-mailu.</p>`);
      },
    },
  },
});
