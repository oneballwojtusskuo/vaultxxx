import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

const FALLBACK_TILES = [
  { tag: "Grafika", title: "Brand system — Nord", meta: "24 plików · Figma" },
  { tag: "Kod", title: "SaaS starter kit", meta: "React · TypeScript" },
  { tag: "Muzyka", title: "Lo-fi loops vol. 3", meta: "18 utworów · WAV" },
  { tag: "3D", title: "Interior pack — Minimal", meta: "Blender · 12 scen" },
  { tag: "E-book", title: "Design ops handbook", meta: "PDF · 120 stron" },
];

function PlaceholderTile({ tag, title, meta }: { tag: string; title: string; meta: string }) {
  return (
    <div className="relative w-full h-full bg-surface-elevated flex flex-col justify-between p-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{tag}</span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-primary">VaultX</span>
      </div>
      <div>
        <p className="font-display text-2xl leading-tight tracking-[-0.02em]">{title}</p>
        <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="absolute inset-x-6 bottom-16 h-px bg-border/40" />
    </div>
  );
}

function Index() {
  const { data: products } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,price,currency,preview_url,is_tradable,downloads_count, category:categories(name)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const featured = products?.[0];
  const rest = products?.slice(1, 5) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="container mx-auto px-6 lg:px-10 pt-16 pb-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10 items-center">
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span className="inline-block h-px w-8 bg-primary/70" />
              Barter dla twórców cyfrowych
            </div>
            <h1 className="mt-6 font-display text-[44px] leading-[1.02] sm:text-6xl lg:text-[76px] font-semibold tracking-[-0.03em]">
              Wymieniaj pracę
              <br />
              zamiast <span className="italic font-normal text-primary">płacić</span> za nią.
            </h1>
            <p className="mt-6 max-w-[46ch] text-base lg:text-lg text-muted-foreground leading-relaxed">
              VaultX to marketplace, w którym projektanci, programiści, muzycy i twórcy 3D
              wymieniają się pracą 1:1 — albo sprzedają ją bez pośredników. Bez subskrypcji,
              bez ukrytych prowizji.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Przeglądaj katalog
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/sell"
                className="inline-flex items-center gap-2 text-sm font-medium border-b border-foreground/40 pb-0.5 hover:border-foreground transition-colors"
              >
                Wystaw swoją pracę
              </Link>
            </div>

            {/* inline mini-ledger */}
            <dl className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              {[
                ["0%", "prowizji za wymianę"],
                ["48h", "rozliczenie sporu"],
                ["1:1", "barter między twórcami"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-display text-2xl">{k}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Featured card */}
          <div className="col-span-12 lg:col-span-5">
            <Link
              to={featured ? "/product/$id" : "/browse"}
              params={featured ? { id: featured.id } : undefined as never}
              className="block group"
            >
              <div className="overflow-hidden border border-border/50 bg-surface aspect-[4/5]">
                {featured?.preview_url ? (
                  <img
                    src={featured.preview_url}
                    alt={featured.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                ) : (
                  <PlaceholderTile
                    tag={featured?.category?.name ?? "Wyróżnione"}
                    title={featured?.title ?? "Twój produkt tutaj"}
                    meta="Dodaj plik · Ustaw cenę lub barter"
                  />
                )}
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {featured?.category?.name ?? "Miejsce na Twoją pracę"}
                  </p>
                  <p className="mt-1 font-display text-lg font-medium truncate">
                    {featured?.title ?? "Wystaw pierwszy produkt"}
                  </p>
                </div>
                <p className="font-display text-lg tabular-nums shrink-0">
                  {featured
                    ? featured.price === 0
                      ? "Wymiana"
                      : `${featured.price.toFixed(0)} ${featured.currency}`
                    : "—"}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 lg:px-10 py-20 lg:py-24 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">— Problem</p>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <h2 className="font-display text-3xl lg:text-5xl font-semibold tracking-[-0.02em] leading-[1.1]">
              Twórcy mają talent. Rzadko mają budżet.
            </h2>
            <div className="mt-8 grid md:grid-cols-2 gap-8 text-muted-foreground leading-relaxed">
              <p>
                Projektant potrzebuje strony. Programista potrzebuje logo. Muzyk potrzebuje
                okładki. Każdy z nich potrafi zrobić coś, czego brakuje drugiemu — ale
                marketplace'y działają tak, jakby jedynym rozliczeniem były pieniądze.
              </p>
              <p className="text-foreground">
                VaultX zamienia to na wymianę. Twoja praca ma tu wartość, nawet jeśli nie masz
                jeszcze klientów — i wraca do Ciebie w postaci pracy kogoś innego.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 lg:px-10 py-20">
          <div className="flex items-end justify-between pb-8 border-b border-border/40">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Katalog</p>
              <h2 className="mt-3 font-display text-3xl lg:text-4xl font-semibold tracking-[-0.02em]">
                Świeżo od twórców
              </h2>
            </div>
            <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm hover:text-primary transition-colors">
              Wszystkie <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-12 gap-6">
            {(rest.length > 0
              ? rest
              : FALLBACK_TILES.slice(0, 4).map((t, i) => ({
                  id: `demo-${i}`,
                  title: t.title,
                  price: i % 2 === 0 ? 0 : 129,
                  currency: "PLN",
                  preview_url: null as string | null,
                  category: { name: t.tag },
                  __placeholder: t,
                }))
            ).map((p: any, i) => (
              <Link
                key={p.id}
                to={String(p.id).startsWith("demo-") ? "/browse" : "/product/$id"}
                params={String(p.id).startsWith("demo-") ? (undefined as never) : { id: p.id }}
                className={
                  "group " +
                  (i % 2 === 0 ? "col-span-12 md:col-span-7" : "col-span-12 md:col-span-5")
                }
              >
                <div className="overflow-hidden bg-surface border border-border/40 aspect-[16/10]">
                  {p.preview_url ? (
                    <img
                      src={p.preview_url}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <PlaceholderTile
                      tag={p.category?.name ?? "Praca"}
                      title={p.title}
                      meta={p.__placeholder?.meta ?? "Dostępne w katalogu"}
                    />
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {p.category?.name ?? "Praca"}
                    </p>
                    <p className="mt-1 font-display text-lg font-medium truncate">{p.title}</p>
                  </div>
                  <p className="font-display text-base tabular-nums shrink-0">
                    {p.price === 0 ? "Wymiana" : `${p.price.toFixed(0)} ${p.currency}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 lg:px-10 py-20 lg:py-24 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">— Jak to działa</p>
            <h2 className="mt-3 font-display text-3xl lg:text-4xl font-semibold tracking-[-0.02em] leading-[1.1]">
              Trzy kroki. Zero pośredników.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Cały proces zaprojektowany tak, żeby wymiana zajęła Ci mniej czasu niż wysłanie faktury.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-8 lg:pl-8">
            <ol className="divide-y divide-border/40 border-y border-border/40">
              {[
                ["Wystaw", "Dodaj pracę, ustaw cenę lub oznacz jako dostępną do wymiany."],
                ["Dogadaj się", "Kupujący płaci albo proponuje wymianę 1:1. Ty akceptujesz."],
                ["Wymień pliki", "Bezpieczne przekazanie. Licencja PDF wystawiana automatycznie."],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-12 gap-6 py-7">
                  <span className="col-span-2 md:col-span-1 font-display text-xl tabular-nums text-muted-foreground">
                    0{i + 1}
                  </span>
                  <div className="col-span-10 md:col-span-11">
                    <p className="font-display text-xl md:text-2xl font-medium">{t}</p>
                    <p className="mt-1.5 text-sm md:text-base text-muted-foreground max-w-[52ch]">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 lg:px-10 py-24 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">— Głos społeczności</p>
            <blockquote className="mt-6 font-display text-2xl lg:text-4xl font-medium tracking-[-0.02em] leading-[1.2]">
              „Wymieniłam pack presetów na skład książki. W dwa dni. Bez faktur, bez czekania,
              bez tłumaczenia klientowi, dlaczego mój czas kosztuje.”
            </blockquote>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40" />
              <div>
                <p className="text-sm font-medium">Marta K.</p>
                <p className="text-xs text-muted-foreground">Fotografka · Warszawa</p>
              </div>
            </div>
          </div>
          <aside className="col-span-12 lg:col-span-4 lg:pl-8 lg:border-l border-border/40">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ostatnie wymiany</p>
            <ul className="mt-6 space-y-5 text-sm">
              {[
                ["Presety Lightroom", "Skład e-booka"],
                ["Ikony SVG (pack 120)", "Ścieżka lo-fi 2:30"],
                ["Landing w React", "Sesja fotograficzna"],
              ].map(([a, b]) => (
                <li key={a} className="flex items-center justify-between gap-4 border-b border-border/30 pb-4 last:border-0">
                  <span className="truncate">{a}</span>
                  <span className="text-muted-foreground shrink-0">↔</span>
                  <span className="truncate text-right text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 lg:px-10 py-20 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <h2 className="font-display text-4xl lg:text-6xl font-semibold tracking-[-0.03em] max-w-[16ch] leading-[1.02]">
            Zacznij wymieniać.
          </h2>
          <div className="flex items-center gap-6">
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Wystaw pracę <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/browse" className="text-sm border-b border-foreground/40 pb-0.5 hover:border-foreground">
              Najpierw obejrzę
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
