import { Link } from "@tanstack/react-router";
import { Download, Repeat2 } from "lucide-react";
import { LikeButton } from "@/components/like-button";

export interface ProductCardData {
  id: string;
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
      params={{ id: p.id }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-surface border border-border/40 transition-all duration-500 hover:border-primary/40 hover:shadow-glow hover:-translate-y-1"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {p.preview_url ? (
          <img
            src={p.preview_url}
            alt={p.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-primary opacity-30" />
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
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{p.category.name}</span>
        )}
        <h3 className="mt-1 font-display text-base font-semibold line-clamp-1">{p.title}</h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gradient">
            {p.price === 0 ? "Free" : `${p.price.toFixed(2)} ${p.currency}`}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="h-3 w-3" /> {p.downloads_count}
          </span>
        </div>
      </div>
    </Link>
  );
}
