import { getPriceReduction, type PriceReductionData } from "@/lib/price-reductions";
import { formatPrice } from "@/lib/pricing";

export function ProductPrice({ product, size = "compact" }: {
  product: PriceReductionData & { currency: string };
  size?: "compact" | "large";
}) {
  const reduction = getPriceReduction(product);
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {reduction && <del className="text-sm text-muted-foreground">{formatPrice(reduction.previous, product.currency)}</del>}
        <span className={size === "large" ? "text-4xl sm:text-5xl font-bold text-foreground" : "text-lg font-bold text-foreground"}>
          {Number(product.price) === 0 ? "Bezpłatny" : formatPrice(product.price, product.currency)}
        </span>
      </div>
      {reduction && <p className={size === "large" ? "mt-2 text-xs text-muted-foreground" : "mt-1 text-[11px] text-muted-foreground"}>
        {reduction.referenceLabel}: {formatPrice(reduction.lowest, product.currency)} (cena twórcy).
      </p>}
    </div>
  );
}