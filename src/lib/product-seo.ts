import { productShareUrl, PRODUCT_SITE } from "@/lib/product-links";

export type ProductSeo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  preview_url: string | null;
  seller?: { username: string | null; display_name: string | null } | null;
};

export function buildProductSeo(product: ProductSeo) {
  const title = `${product.title} | vlnd.pl`;
  const description = (product.description ?? "").replace(/\s+/g, " ").trim();
  const excerpt = Array.from(description).slice(0, 160).join("");
  const image = product.preview_url?.startsWith("https://") ? product.preview_url : undefined;
  const url = productShareUrl(product);
  const sellerName = product.seller?.username || product.seller?.display_name;
  const seller = sellerName ? {
    "@type": "Person",
    name: sellerName,
    ...(product.seller?.username ? { url: `${PRODUCT_SITE}/u/${encodeURIComponent(product.seller.username)}` } : {}),
  } : undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: description || undefined,
    image,
    url,
    offers: {
      "@type": "Offer",
      url,
      price: Number(product.price).toFixed(2),
      priceCurrency: product.currency.toUpperCase(),
      availability: "https://schema.org/InStock",
      seller,
    },
  };
  return {
    meta: [
      { title },
      { name: "description", content: excerpt },
      { property: "og:title", content: product.title },
      { property: "og:description", content: excerpt },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: product.title },
      { name: "twitter:description", content: excerpt },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
    }],
  };
}