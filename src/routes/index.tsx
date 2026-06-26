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
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen" />
        {/* Gold glow accents */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full blur-3xl opacity-40"
             style={{ background: "radial-gradient(closest-side, oklch(0.82 0.14 85 / 0.55), transparent 70%)" }} />
        <div className="pointer-events-none absolute top-40 -left-32 h-[360px] w-[360px] rounded-full blur-3xl opacity-30"
             style={{ background: "radial-gradient(closest-side, oklch(0.78 0.14 70 / 0.6), transparent 70%)" }} />
        <div className="pointer-events-none absolute top-20 -right-24 h-[320px] w-[320px] rounded-full blur-3xl opacity-25"
             style={{ background: "radial-gradient(closest-side, oklch(0.85 0.12 90 / 0.55), transparent 70%)" }} />

        <div className="relative container mx-auto px-4 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Bezgotówkowy barter dla twórców cyfrowych</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            Kupuj, sprzedawaj i <span className="text-gradient">wymieniaj bezgotówkowo</span> materiały cyfrowe
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Połącz siły z innymi twórcami. Wymieniaj kod na grafiki, muzykę na 3D lub sprzedawaj tradycyjnie. Wszystko bezpiecznie w jednym miejscu.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/browse">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow h-12 px-6">
                Odkryj produkty <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/exchanges">
              <Button size="lg" variant="outline" className="h-12 px-6 border-border/60 glass backdrop-blur-md hover:border-primary/50">
                <RefreshCw className="mr-2 h-4 w-4" /> Przetestuj szybką wymianę
              </Button>
            </Link>
          </div>

          {/* Curated category tiles */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
            {[
              { label: "Grafiki & UI", icon: Palette },
              { label: "E-booki & Teksty", icon: BookOpen },
              { label: "Muzyka & Audio", icon: Music },
              { label: "Kod & Skrypty", icon: Code },
              { label: "Modele 3D", icon: Boxes },
              { label: "Wideo & LUTs", icon: Film },
            ].map((t) => (
              <Link
                key={t.label}
                to="/browse"
                className="group relative flex items-center gap-3 rounded-xl glass border border-border/40 px-4 py-3 hover:border-primary/50 hover:shadow-glow transition-all text-left"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow shrink-0">
                  <t.icon className="h-4 w-4 text-primary-foreground" />
                </span>
                <span className="text-sm font-medium">{t.label}</span>
              </Link>
            ))}
          </div>
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
