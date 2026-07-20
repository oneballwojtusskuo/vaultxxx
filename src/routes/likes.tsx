import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { ProductCard } from "@/components/product-card";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/likes")({
  component: Likes,
});

function Likes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: products } = useQuery({
    queryKey: ["my-likes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_likes")
        .select("created_at, product:products(id,title,price,currency,preview_url,is_tradable,downloads_count,status, category:categories(name,icon))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []).map((r: any) => r.product).filter((p: any) => p && p.status === "published");
    },
  });

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 fill-destructive text-destructive" /> Polubione produkty
        </h1>
        <p className="text-muted-foreground mt-1">Twoja lista życzeń — wróć tu, gdy będziesz gotowy na zakup.</p>

        <div className="mt-8">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((p: any) => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-16 rounded-xl border border-dashed border-border/50">
              Jeszcze nic nie polubiłeś. Kliknij ikonę serca na dowolnym produkcie.
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
