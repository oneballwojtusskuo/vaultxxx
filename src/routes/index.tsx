import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

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

      {/* HERO — editorial, asymmetric */}
      <section className="container mx-auto px-6 lg:px-10 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span className="inline-block h-px w-8 bg-primary/70" />
              Barter dla twórców cyfrowych
            </div>
            <h1 className="mt-8 font-display text-[44px] leading-[1.02] sm:text-6xl lg:text-[80px] font-semibold tracking-[-0.03em]">
              Wymieniaj pracę
              <br />
              zamiast <span className="italic font-normal text-primary">płacić</span> za nią.
            </h1>
            <p className="mt-8 max-w-[46ch] text-base lg:text-lg text-muted-foreground leading-relaxed">
              VaultX to marketplace, w którym projektanci, programiści, muzycy i twórcy 3D
              wymieniają się pracą 1:1 — albo sprzedają ją bez pośredników. Bez subskrypcji,
              bez prowizji ukrytych w drobnym druku.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
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
          </div>

          {/* Product preview card — mockup, above the fold, offset */}
          <div className="col-span-12 lg:col-span-5 lg:pt-16">
            <div className="relative lg:-mr-6">
              {featured?.preview_url ? (
                <Link
                  to="/product/$id"
                  params={{ id: featured.id }}
                  className="block group"
                >
                  <div className="overflow-hidden border border-border/50 bg-surface">
                    <img
                      src={featured.preview_url}
                      alt={featured.title}
                      className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {featured.category?.name ?? "Wyróżnione"}
                      </p>
                      <p className="mt-1 font-display text-lg font-medium line-clamp-1">
                        {featured.title}
                      </p>
                    </div>
                    <p className="font-display text-lg tabular-nums">
                      {featured.price === 0 ? "Wymiana" : `${featured.price.toFixed(0)} ${featured.currency}`}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="aspect-[4/5] bg-surface border border-border/50" />
              )}
            </div>
          </div>
        </div>

        {/* Fine print stats — editorial ledger */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 border-t border-border/40 pt-10">
          {[
            ["01", "Wymiana 1:1", "Bez gotówki"],
            ["02", "0%", "Prowizji za barter"],
            ["03", "48h", "Do rozliczenia sporu"],
            ["04", "PL", "Społeczność twórców"],
          ].map(([n, k, v]) => (
            <div key={n}>
              <p className="text-xs text-muted-foreground tabular-nums">{n}</p>
              <p className="mt-3 font-display text-2xl font-medium">{k}</p>
              <p className="mt-1 text-sm text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM — long-form editorial */}
      <section className="container mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground sticky top-24">
              — Problem
            </p>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <h2 className="font-display text-3xl lg:text-5xl font-semibold tracking-[-0.02em] leading-[1.1]">
              Twórcy mają talent. Rzadko mają budżet.
            </h2>
            <div className="mt-10 space-y-6 text-lg text-muted-foreground leading-relaxed max-w-[58ch]">
              <p>
                Projektant potrzebuje strony. Programista potrzebuje logo. Muzyk potrzebuje
                okładki. Każdy z nich potrafi zrobić coś, czego brakuje drugiemu — ale
                marketplace'y działają tak, jakby jedynym rozliczeniem były pieniądze.
              </p>
              <p className="text-foreground">
                VaultX zamienia to na wymianę. Twoja praca ma tu wartość, nawet jeśli nie masz
                jeszcze klientów.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG PREVIEW — asymmetric */}
      <section className="container mx-auto px-6 lg:px-10 py-24">
        <div className="flex items-end justify-between border-b border-border/40 pb-6">
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

        {rest.length > 0 ? (
          <div className="mt-12 grid grid-cols-12 gap-x-6 gap-y-16">
            {rest.map((p, i) => (
              <Link
                key={p.id}
                to="/product/$id"
                params={{ id: p.id }}
                className={
                  "group " +
                  // asymmetric: alternating column spans + vertical offsets
                  (i % 4 === 0
                    ? "col-span-12 md:col-span-7"
                    : i % 4 === 1
                      ? "col-span-12 md:col-span-5 md:pt-16"
                      : i % 4 === 2
                        ? "col-span-12 md:col-span-5"
                        : "col-span-12 md:col-span-7 md:pt-10")
                }
              >
                <div className="overflow-hidden bg-surface border border-border/40">
                  {p.preview_url ? (
                    <img
                      src={p.preview_url}
                      alt={p.title}
                      className="w-full aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[16/10] bg-muted" />
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
        ) : (
          <div className="mt-12 border border-border/40 p-16 text-center">
            <p className="font-display text-2xl">Katalog dopiero się zapełnia.</p>
            <p className="mt-2 text-muted-foreground">Bądź jednym z pierwszych.</p>
            <Link to="/sell" className="mt-6 inline-flex items-center gap-2 text-sm border-b border-foreground/40 pb-0.5">
              Wystaw pierwszą pracę <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* HOW — three steps, editorial numbered */}
      <section className="container mx-auto px-6 lg:px-10 py-24 lg:py-32 border-t border-border/40">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">— Jak to działa</p>
            <h2 className="mt-3 font-display text-3xl lg:text-4xl font-semibold tracking-[-0.02em] leading-[1.1]">
              Trzy kroki. Zero pośredników.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-8 lg:pl-8">
            <ol className="divide-y divide-border/40">
              {[
                ["Wystaw", "Dodaj pracę, ustaw cenę lub oznacz jako dostępną do wymiany."],
                ["Dogadaj się", "Kupujący płaci albo proponuje wymianę 1:1. Ty akceptujesz."],
                ["Wymień pliki", "Bezpieczne przekazanie. Licencja PDF wystawiana automatycznie."],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-12 gap-6 py-8 first:pt-0">
                  <span className="col-span-2 md:col-span-1 font-display text-xl tabular-nums text-muted-foreground">
                    0{i + 1}
                  </span>
                  <div className="col-span-10 md:col-span-11">
                    <p className="font-display text-2xl font-medium">{t}</p>
                    <p className="mt-2 text-muted-foreground max-w-[52ch]">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF — one strong quote */}
      <section className="container mx-auto px-6 lg:px-10 py-28 lg:py-40 border-t border-border/40">
        <div className="max-w-4xl">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">— Głos społeczności</p>
          <blockquote className="mt-8 font-display text-3xl lg:text-5xl font-medium tracking-[-0.02em] leading-[1.15]">
            „Wymieniłam pack presetów na skład książki. W dwa dni. Bez faktur, bez czekania,
            bez tłumaczenia klientowi, dlaczego mój czas kosztuje.”
          </blockquote>
          <div className="mt-10 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40" />
            <div>
              <p className="text-sm font-medium">Marta K.</p>
              <p className="text-xs text-muted-foreground">Fotografka · Warszawa</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — simple */}
      <section className="container mx-auto px-6 lg:px-10 pb-32 pt-8">
        <div className="border-t border-border/40 pt-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
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
