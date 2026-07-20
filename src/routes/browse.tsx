import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
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
});

export const Route = createFileRoute("/browse")({
  validateSearch: (s) => searchSchema.parse(s),
  component: Browse,
});

function Browse() {
  const sp = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(sp.q ?? "");

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
    queryKey: ["browse", sp.category, sp.q],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id,title,price,currency,preview_url,is_tradable,downloads_count, category:categories(name,icon,slug)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (sp.q) query = query.ilike("title", `%${sp.q}%`);
      const { data } = await query;
      let arr = data ?? [];
      if (sp.category) arr = arr.filter((p: any) => p.category?.slug === sp.category);
      return arr;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1">
        <h1 className="font-display text-4xl font-bold">Odkrywaj</h1>
        <p className="text-muted-foreground mt-1">Przeglądaj wszystkie materiały cyfrowe od społeczności.</p>

        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: { ...sp, q: q || undefined } });
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj produktów..." className="pl-9" />
          </div>
          <Button type="submit" className="bg-gradient-primary text-primary-foreground shadow-glow">Szukaj</Button>
        </form>

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
                const name = u.display_name ?? u.username ?? "Twórca";
                const initials = name.slice(0, 2).toUpperCase();
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
                        <span className="text-primary-foreground font-semibold text-sm">{initials}</span>
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
              {products.map((p: any) => <ProductCard key={p.id} p={p} />)}
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
