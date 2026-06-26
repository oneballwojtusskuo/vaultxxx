import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Repeat2, Shield, Zap, Sparkles, Palette, BookOpen, Music, Code, GraduationCap, Camera, Box, Film, Boxes, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero.jpg";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette, BookOpen, Music, Code, GraduationCap, Camera, Box, Sparkles,
};

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: products } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,price,currency,preview_url,is_tradable,downloads_count, category:categories(name,icon)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen" />
        <div className="relative container mx-auto px-4 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Marketplace dla twórców cyfrowych</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            Kupuj, sprzedawaj i <span className="text-gradient">wymieniaj</span> materiały cyfrowe
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Grafiki, e-booki, muzyka, kod, kursy, modele 3D. Wszystko w jednym miejscu — z możliwością wymiany jeden-na-jeden z innymi twórcami.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/browse">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow h-12 px-6">
                Odkryj produkty <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/sell">
              <Button size="lg" variant="outline" className="h-12 px-6 border-border/60">
                Zacznij sprzedawać
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories?.map((c) => {
            const Icon = ICONS[c.icon ?? "Sparkles"] ?? Sparkles;
            return (
              <Link
                key={c.id}
                to="/browse"
                search={{ category: c.slug }}
                className="group flex flex-col items-center gap-2 rounded-xl bg-gradient-surface border border-border/40 p-4 hover:border-primary/50 hover:shadow-glow transition-all"
              >
                <Icon className="h-6 w-6 text-accent group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium text-center">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Natychmiastowy dostęp", desc: "Pobierz pliki od razu po zakupie. Bez czekania, bez kolejek." },
            { icon: Repeat2, title: "Wymiana 1:1", desc: "Wymień swój produkt na czyjś. Idealne dla twórców szukających inspiracji." },
            { icon: Shield, title: "Bezpieczne transakcje", desc: "Płatności i pliki chronione. Każdy twórca to zweryfikowany użytkownik." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-gradient-surface border border-border/40 p-6 hover:border-primary/40 transition-colors">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container mx-auto px-4 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Najnowsze produkty</h2>
            <p className="text-muted-foreground mt-1">Świeżo dodane przez społeczność</p>
          </div>
          <Link to="/browse" className="text-sm text-accent hover:text-primary inline-flex items-center gap-1">
            Zobacz wszystkie <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => <ProductCard key={p.id} p={p as any} />)}
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-surface border border-border/40 p-12 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-accent mb-4" />
            <h3 className="font-display text-xl font-semibold">Bądź pierwszy</h3>
            <p className="text-muted-foreground mt-1">Nikt jeszcze nic nie wystawił. Wystaw swój pierwszy produkt!</p>
            <Link to="/sell" className="inline-block mt-4">
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow">Wystaw produkt</Button>
            </Link>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
