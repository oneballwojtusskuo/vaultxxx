// Pricing helpers.
// Seller receives 100% of the price they set. The buyer pays the seller price
// plus a 10% platform margin plus the payment fee (1.6% + 1.00 PLN), so:
//   Total = (price * 1.10 + 1.00) / (1 - 0.016)
export const PLATFORM_MARKUP_PCT = 10;
export const PAYMENT_FIXED_FEE = 1.0;
export const PAYMENT_PCT_FEE = 0.016;

export function buyerPriceOf(sellerNet: number | string): number {
  const n = Number(sellerNet) || 0;
  if (n <= 0) return 0;
  const total = (n * (1 + PLATFORM_MARKUP_PCT / 100) + PAYMENT_FIXED_FEE) / (1 - PAYMENT_PCT_FEE);
  return Math.round(total * 100) / 100;
}

/** Service + payment fee shown to buyer (Total - seller price). */
export function buyerFeeOf(sellerNet: number | string): number {
  const n = Number(sellerNet) || 0;
  return +(buyerPriceOf(n) - n).toFixed(2);
}

export function formatPrice(amount: number | string, currency = "PLN"): string {
  const n = Number(amount) || 0;
  return `${n.toFixed(2).replace(".", ",")} ${currency}`;
}
