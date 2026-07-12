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

      {/* HERO — Editorial navy journal */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="pointer-events-none absolute -top-24 -right-24 h-[480px] w-[480px] rounded-full blur-3xl opacity-30"
             style={{ background: "radial-gradient(closest-side, oklch(0.82 0.14 82 / 0.4), transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full blur-3xl opacity-20"
             style={{ background: "radial-gradient(closest-side, oklch(0.55 0.14 82 / 0.5), transparent 70%)" }} />

        <div className="relative container mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 items-start">
            {/* LEFT 60% */}
            <div className="lg:col-span-6 space-y-10 lg:border-l lg:border-accent/30 lg:pl-10">
              <div className="space-y-5">
                <span className="block eyebrow">Platforma barterowa № 01</span>
                <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.85] italic">
                  Vault<span className="text-accent">X</span>
                </h1>
                <p className="font-display text-2xl md:text-4xl lg:text-5xl leading-[1.05] max-w-2xl">
                  Kupuj, sprzedawaj, <span className="text-accent">wymieniaj</span> bezgotówkowo.
                </p>
              </div>

              <div className="max-w-md">
                <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
                  Przywracamy ludzki wymiar handlu cyfrowego. Dołącz do społeczności twórców, gdzie kod, grafika, muzyka i wiedza mają realną wartość — bez pośrednictwa waluty.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-6">
                  <Link to="/browse">
                    <Button size="lg" className="h-12 px-8 rounded-none bg-accent text-accent-foreground hover:bg-primary-glow uppercase tracking-widest text-xs font-bold">
                      Zacznij wymianę
                    </Button>
                  </Link>
                  <Link
                    to="/browse"
                    className="uppercase tracking-widest text-xs font-semibold border-b border-accent pb-1 hover:text-accent transition-colors"
                  >
                    Zobacz rynek →
                  </Link>
                </div>
              </div>

              {/* Feature highlights — editorial numbered */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-10">
                {[
                  { n: "01", t: "Bezpieczny skarbiec", d: "Gwarancja uczciwej transakcji i chronione pliki." },
                  { n: "02", t: "Wymiana 1:1", d: "Bezgotówkowy barter między twórcami cyfrowymi." },
                  { n: "03", t: "Błyskawiczny dostęp", d: "Pobierz plik natychmiast po zakupie." },
                ].map((f) => (
                  <div key={f.n} className="space-y-2">
                    <span className="font-display text-4xl text-accent italic">{f.n}</span>
                    <h3 className="font-sans font-bold uppercase tracking-tight text-sm">{f.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT 40% — Editorial visual */}
            <div className="lg:col-span-4 relative mt-8 lg:mt-4">
              <div className="pointer-events-none absolute -top-8 -right-4 select-none opacity-[0.08]">
                <span className="font-display text-[10rem] md:text-[14rem] leading-none italic">VX</span>
              </div>

              <div className="relative z-10 aspect-[4/5] overflow-hidden border-8 shadow-elevated"
                   style={{ borderColor: "oklch(0.28 0.07 258)" }}>
                <img src={heroImg} alt="Rzemiosło & pasja twórców" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, oklch(0.19 0.07 260 / 0.85))" }} />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="eyebrow block mb-2">Edycja bieżąca</span>
                  <p className="font-display text-2xl italic leading-tight">Rzemiosło &amp; pasja</p>
                </div>
              </div>

              {/* Mustard offset callout */}
              <div className="relative z-20 lg:absolute lg:-bottom-10 lg:-left-10 mt-4 lg:mt-0 w-full lg:w-56 bg-accent p-6 text-accent-foreground shadow-elevated">
                <div className="text-[10px] font-bold uppercase leading-tight tracking-tighter mb-4">
                  Ostatnia<br/>aktualizacja<br/>2026
                </div>
                <div className="font-display text-4xl leading-none">
                  8,2k+
                  <span className="block text-[10px] font-sans font-semibold uppercase tracking-widest mt-2 italic not-italic">
                    Aktywnych ofert
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category strip — editorial index */}
          <div className="mt-24 pt-10 border-t border-accent/20">
            <div className="flex items-baseline justify-between mb-6">
              <span className="eyebrow">Spis kategorii</span>
              <span className="text-xs text-muted-foreground font-mono">— sześć działów</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-accent/20">
              {[
                { label: "Grafiki & UI", icon: Palette, slug: "graphics", n: "I" },
                { label: "E-booki & Teksty", icon: BookOpen, slug: "ebooks", n: "II" },
                { label: "Muzyka & Audio", icon: Music, slug: "music", n: "III" },
                { label: "Kod & Skrypty", icon: Code, slug: "code", n: "IV" },
                { label: "Modele 3D", icon: Boxes, slug: "3d", n: "V" },
                { label: "Wideo & LUTs", icon: Film, slug: "photos", n: "VI" },
              ].map((t) => (
                <Link
                  key={t.label}
                  to="/browse"
                  search={{ category: t.slug }}
                  className="group relative bg-background hover:bg-surface transition-colors px-5 py-6 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display italic text-accent text-xl">{t.n}</span>
                    <t.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <span className="font-display text-lg leading-tight">{t.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* FEATURED */}
      <section className="container mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-10 border-b border-accent/20 pb-6">
          <div>
            <span className="eyebrow block mb-3">Kronika № 02</span>
            <h2 className="font-display text-4xl md:text-5xl italic">Najnowsze produkty</h2>
            <p className="text-muted-foreground mt-2">Świeżo dodane przez społeczność twórców.</p>
          </div>
          <Link to="/browse" className="hidden md:inline-flex text-xs uppercase tracking-widest font-semibold border-b border-accent pb-1 hover:text-accent transition-colors">
            Zobacz wszystkie →
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
