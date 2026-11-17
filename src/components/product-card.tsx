import { Link } from "@tanstack/react-router";
import { Download, Repeat2, FileText } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { minBuyerPriceOf, formatPrice } from "@/lib/pricing";
import { productUrlKey } from "@/lib/product-links";

export interface ProductCardData {
  id: string;
  slug?: string | null;
  title: string;
  price: number;
  currency: string;
  preview_url: string | null;
  is_tradable: boolean;
  downloads_count: number;
  category?: { name: string; icon: string | null } | null;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: productUrlKey(p) }}
      className="group relative block min-w-0 overflow-hidden rounded-lg bg-card border border-border shadow-soft transition-shadow hover:shadow-elevated"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {p.preview_url ? (
          <img
            src={p.preview_url}
            alt={p.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><FileText className="h-10 w-10" /></div>
        )}
        {p.is_tradable && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full glass px-2.5 py-1 text-xs font-medium">
            <Repeat2 className="h-3 w-3" /> wymiana
          </span>
        )}
        <div className="absolute top-2 left-2 glass rounded-full">
          <LikeButton productId={p.id} sellerId={(p as any).seller_id ?? null} variant="icon" />
        </div>
      </div>
      <div className="p-4">
        {p.category && (
          <span className="text-xs text-muted-foreground">
            {p.category.name}
          </span>
        )}
        <h3 className="mt-2 min-h-12 font-display text-base font-semibold line-clamp-2 leading-6">{p.title}</h3>
        <div className="mt-3 flex flex-wrap gap-2 items-center justify-between">
          <span className="text-lg font-bold text-foreground">
            {Number(p.price) === 0 ? "Bezpłatny" : formatPrice(p.price, p.currency)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="h-3 w-3" /> {p.downloads_count}
          </span>
        </div>
        {Number(p.price) > 0 && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            od ~{formatPrice(minBuyerPriceOf(p.price), p.currency)} z opłatą transakcyjną
          </p>
        )}
      </div>
    </Link>
  );
}
