export interface PriceReductionData {
  price: number | string;
  previous_price?: number | string | null;
  lowest_price_before_reduction?: number | string | null;
  price_history_started_at?: string | null;
  reduction_reference_since?: string | null;
}

export function getPriceReduction(product: PriceReductionData) {
  const current = Number(product.price);
  const previous = Number(product.previous_price);
  const lowest = Number(product.lowest_price_before_reduction);
  // A temporary price increase must not manufacture a promotion.
  if (!Number.isFinite(current) || current < 0 || !Number.isFinite(previous) ||
      !Number.isFinite(lowest) || previous <= current || lowest <= current) return null;
  const start = Date.parse(product.price_history_started_at ?? "");
  const since = Date.parse(product.reduction_reference_since ?? "");
  if (!Number.isFinite(start) || !Number.isFinite(since)) return null;
  const fullHistory = since > start + 1000;
  return {
    previous,
    lowest,
    referenceLabel: fullHistory
      ? "Najniższa cena z 30 dni przed obniżką"
      : `Najniższa cena przed obniżką (historia od ${new Date(start).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" })})`,
  };
}