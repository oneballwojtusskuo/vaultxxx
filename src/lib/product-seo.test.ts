import { describe, expect, it } from "vitest";
import { buildProductSeo, type ProductSeo } from "./product-seo";

const product: ProductSeo = {
  id: "123", slug: "biznes-planner", title: "Biznes Planner",
  description: "Opis produktu. ".repeat(20), price: 10, currency: "PLN",
  preview_url: "https://vlnd.pl/cover.jpg",
  seller: { username: "tworca", display_name: "Twórca" },
};

describe("product SEO", () => {
  it("keeps the full product name in the required page title", () => {
    const name = "Długi tytuł produktu ".repeat(5);
    expect(buildProductSeo({ ...product, title: name }).meta[0]).toEqual({ title: `${name} | vlnd.pl` });
  });
  it("takes the first 160 characters of the specific description, without price copy", () => {
    const result = buildProductSeo(product);
    expect(result.meta.find(m => "name" in m && m.name === "description")?.content)
      .toBe(product.description?.trim().slice(0, 160));
  });
  it("keeps short descriptions intact and normalizes whitespace", () => {
    expect(buildProductSeo({ ...product, description: "  Pierwsza\n linia. " }).meta[1].content).toBe("Pierwsza linia.");
  });
  it("uses the product cover for both sharing image tags", () => {
    const images = buildProductSeo(product).meta.filter(m => ("property" in m && m.property === "og:image") || ("name" in m && m.name === "twitter:image"));
    expect(images.map(m => m.content)).toEqual([product.preview_url, product.preview_url]);
  });
  it("exposes the actual PLN price, stock and public seller in the offer", () => {
    const data = JSON.parse(buildProductSeo(product).scripts[0].children);
    expect(data).toMatchObject({ "@type": "Product", name: "Biznes Planner", image: product.preview_url,
      offers: { price: "10.00", priceCurrency: "PLN", availability: "https://schema.org/InStock", seller: { name: "tworca", url: "https://vlnd.pl/u/tworca" } } });
  });
  it("keeps the canonical URL on the immutable product slug", () => {
    expect(buildProductSeo(product).links[0].href).toBe("https://vlnd.pl/product/biznes-planner");
  });
  it("escapes description markup in the structured-data script", () => {
    const result = buildProductSeo({ ...product, description: "</script><script>" });
    expect(result.scripts[0].children).not.toContain("</script>");
    expect(JSON.parse(result.scripts[0].children).description).toBe("</script><script>");
  });
});