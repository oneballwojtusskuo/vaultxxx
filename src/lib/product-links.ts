export const PRODUCT_SITE = "https://vlnd.pl";

export function isProductId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function productUrlKey(product: { id: string; slug?: string | null }): string {
  return product.slug || product.id;
}

export function productShareUrl(product: { id: string; slug?: string | null }): string {
  return `${PRODUCT_SITE}/product/${encodeURIComponent(productUrlKey(product))}`;
}