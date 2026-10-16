// Pricing helpers.
// Seller receives 100% of the price they set. The buyer pays the seller price
// plus a 10% platform margin plus the payment operator fee of the chosen
// payment method:
//   Total = (price * 1.10 + fixed) / (1 - pct)
export const PLATFORM_MARKUP_PCT = 10;

export type PaymentMethod = "blik" | "card" | "p24";

/** Payment operator fees per method (percentage as fraction, fixed in PLN). */
export const PAYMENT_FEES: Record<PaymentMethod, { pct: number; fixed: number; label: string }> = {
  blik: { pct: 0.016, fixed: 1.0, label: "BLIK" },
  // Card rate covers premium / business EU cards to stay safe.
  card: { pct: 0.019, fixed: 1.0, label: "Karta płatnicza" },
  p24: { pct: 0.019, fixed: 1.0, label: "Przelewy24" },
};

export const PAYMENT_METHODS: PaymentMethod[] = ["blik", "card", "p24"];

export function buyerPriceOf(sellerNet: number | string, method: PaymentMethod = "blik"): number {
  const n = Number(sellerNet) || 0;
  if (n <= 0) return 0;
  const f = PAYMENT_FEES[method];
  const total = (n * (1 + PLATFORM_MARKUP_PCT / 100) + f.fixed) / (1 - f.pct);
  return Math.round(total * 100) / 100;
}

/** Service + payment fee shown to buyer (Total - seller price). */
export function buyerFeeOf(sellerNet: number | string, method: PaymentMethod = "blik"): number {
  const n = Number(sellerNet) || 0;
  return +(buyerPriceOf(n, method) - n).toFixed(2);
}

/** Lowest total across methods (used for "od ~X PLN" on listings). */
export function minBuyerPriceOf(sellerNet: number | string): number {
  return Math.min(...PAYMENT_METHODS.map((m) => buyerPriceOf(sellerNet, m)));
}

export function formatPrice(amount: number | string, currency = "PLN"): string {
  const n = Number(amount) || 0;
  return `${n.toFixed(2).replace(".", ",")} ${currency}`;
}
