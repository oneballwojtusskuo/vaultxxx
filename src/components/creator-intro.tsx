import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroAsset from "@/assets/tlo.jpg.asset.json";
import { productUrlKey } from "@/lib/product-links";
import type { ProductCardData } from "@/components/product-card";

export function CreatorIntro() {
  return (
    <>
      <section className="creator-hero relative overflow-hidden" aria-labelledby="creator-title">
        <img src={heroAsset.url} alt="Stanowisko pracy z laptopem przy oknie" width={1920} height={832} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[65%_center]" />
        <div className="creator-hero-shade absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
          <p className="mb-5 text-sm font-medium text-hero-foreground/80">Twój pomysł. Twój plik. Twój produkt.</p>
          <h1 id="creator-title" className="max-w-lg font-display text-3xl font-semibold leading-[1.12] text-hero-foreground sm:text-5xl">Produkty cyfrowe.<br />Prosto od twórców.</h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-hero-foreground/85">Sprzedawaj własne e-booki, plannery i szablony. Albo znajdź coś, co przyda się Tobie.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 bg-card px-5 text-card-foreground shadow-none hover:bg-card/90">
              <Link to="/auth" search={{ mode: "signup", next: "/sell" }}>Zacznij sprzedawać <ArrowUpRight /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 border-hero-foreground/50 bg-transparent px-5 text-hero-foreground shadow-none hover:bg-hero-foreground/10 hover:text-hero-foreground">
              <a href="#odkrywaj">Przeglądaj produkty <ArrowDown /></a>
            </Button>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-hero-foreground/75">Bez opłat za wystawienie. Płatności obsługuje Stripe.</p>
        </div>
      </section>
      <div className="hidden border-b border-border bg-card md:block">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-border px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
          <p className="py-4 text-sm sm:pr-5"><span className="font-semibold">Bez opłat dla twórcy</span><span className="ml-2 text-muted-foreground">Konto, wystawianie i sprzedaż — zawsze bez opłat platformy.</span></p>
          <p className="py-4 text-sm sm:px-5"><span className="font-semibold">Zacznij w kilka chwil</span><span className="ml-2 text-muted-foreground">Załóż konto, dodaj plik i wyślij do akceptacji.</span></p>
          <p className="py-4 text-sm sm:pl-5"><span className="font-semibold">Zarabiaj na poleceniach</span><span className="ml-2 text-muted-foreground">Afiliacja: polecaj produkty i otrzymuj prowizję za zakupy.</span></p>
        </div>
      </div>
    </>
  );
}

export function CreatorSteps({ guide }: { guide?: ProductCardData }) {
  return (
    <section id="dla-tworcow" className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="mb-3 text-sm font-medium text-primary">Dla twórców</p><h2 className="font-display text-3xl font-semibold">Masz plik, który warto udostępnić?</h2></div>
          <Button asChild size="lg" className="w-fit h-11"><Link to="/auth" search={{ mode: "signup", next: "/sell" }}>Wystaw pierwszy produkt <ArrowUpRight /></Link></Button>
        </div>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {[
            ["Dodaj swój materiał", "Wgraj plik i okładkę. Opisz, co kupujący znajdzie w środku."],
            ["Ustal warunki", "Wybierz cenę i licencję. Przy płatnym produkcie połącz konto Stripe."],
            ["Podziel się linkiem", "Po akceptacji produkt pojawi się na vlnd. Wyślij jego link swoim odbiorcom."],
          ].map(([title, text], i) => <li key={title} className="border-t border-border pt-5"><span className="text-sm font-medium text-primary">0{i + 1}</span><h3 className="mt-3 text-lg font-semibold">{title}</h3><p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{text}</p></li>)}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs leading-relaxed text-muted-foreground"><p>Opłaty serwisowe i płatnicze są doliczane kupującemu.</p><Link to="/help" className="font-medium text-primary underline underline-offset-4">Sprawdź zasady sprzedaży</Link></div>
        {guide && <div className="mt-12 flex flex-col justify-between gap-5 border-t border-border pt-8 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            {guide.preview_url ? <img src={guide.preview_url} alt="Okładka przewodnika sprzedaży vlnd" className="h-24 w-18 shrink-0 rounded-sm object-cover" loading="lazy" /> : <FileText className="h-10 w-10 shrink-0 text-primary" />}
            <div><p className="text-xs font-medium text-primary">Bezpłatny przewodnik</p><h3 className="mt-2 text-xl font-semibold">Zacznij od dobrego planu.</h3><p className="mt-2 text-sm text-muted-foreground">Przeczytaj przewodnik sprzedaży na vlnd, zanim wystawisz pierwszy produkt.</p></div>
          </div>
          <Button asChild variant="outline" size="lg" className="w-fit shrink-0"><Link to="/product/$id" params={{ id: productUrlKey(guide) }}>Zobacz przewodnik <ArrowUpRight /></Link></Button>
        </div>}
      </div>
    </section>
  );
}