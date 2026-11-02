import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import { listPublishedProductsForSitemap } from "@/lib/seo.functions";
import { sitemapStaticPaths, sitemapXML, type SitemapEntry } from "@/lib/sitemap";
import { productUrlKey } from "@/lib/product-links";

const DEFAULT_BASE_URL = "https://vlnd.lovable.app";
const ALLOWED_HOSTS = new Set(["vlnd.lovable.app", "vlnd.pl", "www.vlnd.pl"]);

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = new URL(request.url).hostname.toLowerCase();
        const baseUrl = ALLOWED_HOSTS.has(host) ? `https://${host}` : DEFAULT_BASE_URL;
        const router = await getRouterInstance();
        const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));
        try {
          const products = await listPublishedProductsForSitemap();
          for (const p of products) entries.push({ path: `/product/${productUrlKey(p)}`, lastmod: p.updated_at });
        } catch (e) {
          return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
        }
        if (entries.length === 0) {
          return new Response("No pages are included in this sitemap.", {
            status: 404,
            headers: { "Cache-Control": "no-store" },
          });
        }
        return new Response(sitemapXML(baseUrl, entries), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
