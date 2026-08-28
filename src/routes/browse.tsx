import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-browser";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minDownloads: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(["relevance", "newest", "price_asc", "price_desc", "popular", "rating"]).optional(),
  freeOnly: z.boolean().optional(),
  tradableOnly: z.boolean().optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: (s) => searchSchema.parse(s),
  component: Browse,
});

function Browse() {
  const sp = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(sp.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: cats } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: users } = useQuery({
    queryKey: ["browse-users", sp.q],
    enabled: !!sp.q,
    queryFn: async () => {
      const term = sp.q!;
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_verified_seller, bio")
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(12);
      return data ?? [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["browse", sp],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("search_products", {
        q: sp.q ?? null,
        cat: sp.category ?? null,
        min_price: sp.minPrice ?? null,
        max_price: sp.maxPrice ?? null,
        sort_by: sp.sort ?? "relevance",
        min_seller_rating: sp.minRating ?? null,
        free_only: sp.freeOnly ?? false,
        tradable_only: sp.tradableOnly ?? false,
        min_downloads: sp.minDownloads ?? null,
      });
      let rows = data;
      if (error) {
        const fallback = await supabase
          .from("products")
          .select(
            "id,title,price,currency,preview_url,is_tradable,downloads_count,seller_id,category_id,tags,description,created_at",
          )
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(240);
        if (fallback.error) throw error;
        const normalized = (sp.q ?? "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ł/g, "l");
        rows = (fallback.data ?? []).filter((row: any) => {
          const haystack = `${row.title} ${row.description ?? ""} ${(row.tags ?? []).join(" ")}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ł/g, "l");
          return !normalized || normalized.split(/\s+/).every((token) => haystack.includes(token));
        });
      }
      return (rows ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        price: r.price,
        currency: r.currency,
        preview_url: r.preview_url,
        is_tradable: r.is_tradable,
        downloads_count: r.downloads_count,
        seller_id: r.seller_id,
        category: r.category_name
          ? {
              name: r.custom_category
                ? `${r.category_name} · ${r.custom_category}`
                : r.category_name,
              icon: r.category_icon,
              slug: r.category_slug,
            }
          : null,
      }));
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1">
        <h1 className="font-display text-4xl font-bold">Odkrywaj</h1>
        <p className="text-muted-foreground mt-1">
          Przeglądaj wszystkie materiały cyfrowe od społeczności.
        </p>

        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: { ...sp, q: q || undefined } });
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Szukaj produktów..."
              className="pl-9"
            />
          </div>
          <Button type="submit" className="bg-gradient-primary text-primary-foreground shadow-glow">
            Szukaj
          </Button>
        </form>

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((value) => !value)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtry
          </Button>
          {filtersOpen && (
            <div className="mt-3 grid gap-3 rounded-xl border border-border/40 bg-gradient-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                type="number"
                min="0"
                placeholder="Cena od"
                value={sp.minPrice ?? ""}
                disabled={sp.freeOnly === true}
                onChange={(e) =>
                  navigate({
                    search: {
                      ...sp,
                      minPrice: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
              <Input
                type="number"
                min="0"
                placeholder="Cena do"
                value={sp.maxPrice ?? ""}
                disabled={sp.freeOnly === true}
                onChange={(e) =>
                  navigate({
                    search: {
                      ...sp,
                      maxPrice: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={sp.minRating?.toString() ?? ""}
                onChange={(e) =>
                  navigate({
                    search: {
                      ...sp,
                      minRating: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              >
                <option value="">Ocena twórcy od</option>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating.toFixed(1).replace(".0", "")} lub więcej
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min="0"
                placeholder="Pobrań od"
                value={sp.minDownloads ?? ""}
                onChange={(e) =>
                  navigate({
                    search: {
                      ...sp,
                      minDownloads: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={sp.sort ?? "relevance"}
                onChange={(e) => navigate({ search: { ...sp, sort: e.target.value as any } })}
              >
                <option value="relevance">Najtrafniejsze</option>
                <option value="newest">Najnowsze</option>
                <option value="price_asc">Cena rosnąco</option>
                <option value="price_desc">Cena malejąco</option>
                <option value="popular">Najpopularniejsze</option>
                <option value="rating">Najwyżej oceniani twórcy</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sp.freeOnly ?? false}
                  onChange={(e) =>
                    navigate({
                      search: {
                        ...sp,
                        freeOnly: e.target.checked || undefined,
                        minPrice: e.target.checked ? undefined : sp.minPrice,
                        maxPrice: e.target.checked ? undefined : sp.maxPrice,
                      },
                    })
                  }
                />{" "}
                Tylko darmowe
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sp.tradableOnly ?? false}
                  onChange={(e) =>
                    navigate({ search: { ...sp, tradableOnly: e.target.checked || undefined } })
                  }
                />{" "}
                Możliwość wymiany
              </label>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/browse"
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${!sp.category ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
          >
            Wszystkie
          </Link>
          {cats?.map((c) => (
            <Link
              key={c.id}
              to="/browse"
              search={{ category: c.slug }}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${sp.category === c.slug ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {sp.q && users && users.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold mb-3">Twórcy pasujący do „{sp.q}"</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.map((u) => {
                const name = u.username ?? u.display_name ?? "Twórca";
                const initials = name.slice(0, 1).toUpperCase();
                return (
                  <Link
                    key={u.id}
                    to="/u/$username"
                    params={{ username: u.username ?? "" }}
                    className="flex items-center gap-3 rounded-xl bg-gradient-surface border border-border/40 p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary-foreground font-semibold text-sm">
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-20">Ładowanie...</div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((p: any) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-20">
              {sp.q ? "Brak produktów pasujących do zapytania." : "Brak wyników."}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
