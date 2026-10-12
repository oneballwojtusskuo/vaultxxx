export const MIN_PAID_PRICE = 2;
export const PRICE_ERROR =
  "Cena musi wynosić 0.00 PLN (produkt darmowy) lub co najmniej 2.00 PLN (ze względu na wymogi operatora płatności).";

/** Returns an error message, or null when the price is allowed. */
export function validatePrice(raw: string | number): string | null {
  const v = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  if (!Number.isFinite(v)) return "Podaj poprawną cenę.";
  if (v < 0) return "Cena nie może być ujemna.";
  if (v > 0 && v < MIN_PAID_PRICE) return PRICE_ERROR;
  return null;
}
