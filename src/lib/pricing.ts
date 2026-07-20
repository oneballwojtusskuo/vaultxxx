// Escrow pricing helpers.
// Seller enters the NET amount they want to receive.
// Buyer sees NET + 10% (platform markup).
export const PLATFORM_MARKUP_PCT = 10;

export function buyerPriceOf(sellerNet: number | string): number {
  const n = Number(sellerNet) || 0;
  return +(n * (1 + PLATFORM_MARKUP_PCT / 100)).toFixed(2);
}

export function formatPrice(amount: number | string, currency = "PLN"): string {
  const n = Number(amount) || 0;
  return `${n.toFixed(2)} ${currency}`;
}
