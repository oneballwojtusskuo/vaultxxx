import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Shield,
  Repeat,
  Users,
  Percent,
  X,
  Upload,
  ShoppingBag,
  Globe,
  ChevronDown,
  ChevronUp,
  Headphones,
  Compass,
  ArrowRight,
  Lock,
  FileCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_KEY = "vlnd_welcome_seen_v1";
const LANG_KEY = "vlnd_welcome_lang";

type Lang = "pl" | "en";

const TRANSLATIONS = {
  pl: {
    title: "Sprawdź jak to działa",
    subtitle: "Krótki przewodnik po vlnd",
    close: "Zamknij",
    language: "Język",
    intro:
      "vlnd to marketplace dla twórców cyfrowych. Kupuj, sprzedawaj i wymieniaj się plikami — grafikami, muzyką, kodem, kursami, e-bookami i modelami 3D — prosto od autorów, bez korporacyjnych pośredników.",
    rows: {
      buy: {
        title: "Kupuj cyfrowe pliki",
        text: "Grafika, muzyka, e‑booki, kod, kursy, modele 3D — od twórców, nie od korporacji.",
      },
      sell: {
        title: "Sprzedawaj w kilka minut",
        text: "Wgraj plik, okładkę i próbkę ze znakiem wodnym, ustaw cenę i licencję — gotowe.",
      },
      swap: {
        title: "Wymieniaj się bez pieniędzy",
        text: "Zaproponuj wymianę plik‑za‑plik. Dostęp odblokowuje się po obustronnym potwierdzeniu.",
      },
      affiliate: {
        title: "Zarabiaj na afiliacji",
        text: "Udostępniaj linki polecające i zgarniaj % od każdej sprzedaży z Twojego linku.",
      },
      escrow: {
        title: "Bezpieczeństwo (Escrow)",
        text: "Pieniądze trafiają do depozytu. Masz 24 godziny na potwierdzenie odbioru lub zgłoszenie problemu; później środki są automatycznie zwalniane.",
      },
      fee: {
        title: "Uczciwa prowizja",
        text: "vlnd dolicza tylko 10% do ceny sprzedawcy — reszta trafia w całości do twórcy.",
      },
    },
    learnMore: "Dowiedz się więcej",
    showLess: "Zwiń",
    browse: "Przeglądaj",
    help: "Pomoc",
    signup: "Załóż konto",
    expanded: {
      title: "Dlaczego vlnd?",
      sections: [
        {
          icon: "shield",
          title: "Depozyt (Escrow) chroni obie strony",
          text: "Kupując płacisz razem z niewielką prowizją, ale środki nie trafiają od razu do sprzedawcy. Masz 24 godziny na sprawdzenie, czy plik spełnia opis. Jeśli nic nie zgłosisz, środki zostaną automatycznie zwolnione. Jeśli coś jest nie tak — masz procedurę reklamacyjną.",
        },
        {
          icon: "repeat",
          title: "Wymiany plików bez płatności",
          text: "Masz coś wartościowego, ale wolisz zamienić się na inny asset? Wyślij propozycję wymiany. Gdy obie strony się zgodzą, dostęp do plików zostaje odblokowany dla obu użytkowników jednocześnie — fair deal.",
        },
        {
          icon: "users",
          title: "Afiliacja dla influencerów i twórców",
          text: "Każdy produkt może mieć własny program partnerski. Sprzedawca ustala % prowizji dla polecających, a Ty generujesz unikalny link i zarabiasz na każdym zakupie z Twojego kanału.",
        },
        {
          icon: "lock",
          title: "Anti-piracy i licencje",
          text: "Pliki są chronione znakiem wodnym, próbki są automatycznie zabezpieczane, a po zakupie otrzymujesz wygenerowaną licencję PDF z hashem transakcji. To jasny dowód na legalność użytkowania.",
        },
        {
          icon: "zap",
          title: "Szybka weryfikacja produktów",
          text: "Każdy nowy produkt przechodzi przez weryfikację zespołu vlnd, zanim trafi do kupujących. Dzięki temu znikają oszustwa, spam i niskiej jakości treści.",
        },
        {
          icon: "file-check",
          title: "Przejrzyste prowizje",
          text: "Sprzedawca ustala swoją cenę netto. Cena dla kupującego to cena netto + 10%. Po zatwierdzeniu transakcji sprzedawca otrzymuje dokładnie swoją cenę, a 10% trafia na utrzymanie platformy, moderację i rozwój bezpieczeństwa.",
        },
      ],
      cta: "Przeglądaj ofertę",
    },
  },
  en: {
    title: "See how it works",
    subtitle: "A quick guide to vlnd",
    close: "Close",
    language: "Language",
    intro:
      "vlnd is a marketplace for digital creators. Buy, sell, and swap digital files — graphics, music, code, courses, e-books, and 3D models — directly from authors, without corporate middlemen.",
    rows: {
      buy: {
        title: "Buy digital files",
        text: "Graphics, music, e-books, code, courses, 3D models — from creators, not corporations.",
      },
      sell: {
        title: "Sell in minutes",
        text: "Upload your file, cover, and watermarked sample, set a price and license — you're done.",
      },
      swap: {
        title: "Swap without cash",
        text: "Propose a file-for-file trade. Access is unlocked only after both sides confirm.",
      },
      affiliate: {
        title: "Earn from referrals",
        text: "Share affiliate links and earn a percentage from every sale through your link.",
      },
      escrow: {
        title: "Secure escrow",
        text: "Funds are held in escrow — the seller is paid only after you confirm the file is as described.",
      },
      fee: {
        title: "Fair 10% fee",
        text: "vlnd adds only 10% to the seller's price — the rest goes directly to the creator.",
      },
    },
    learnMore: "Learn more",
    showLess: "Show less",
    browse: "Browse",
    help: "Help",
    signup: "Sign up",
    expanded: {
      title: "Why vlnd?",
      sections: [
        {
          icon: "shield",
          title: "Escrow protects both sides",
          text: "When you buy, you pay a small fee on top, but the funds are not released immediately. They are held until you confirm the file matches the description. Only then does the creator receive payment. If something is wrong, there is a dispute process.",
        },
        {
          icon: "repeat",
          title: "File swaps without payments",
          text: "Have something valuable but prefer to trade it for another asset? Send a swap proposal. Once both sides agree, file access is unlocked for both users at the same time — a fair deal.",
        },
        {
          icon: "users",
          title: "Affiliation for influencers and creators",
          text: "Every product can have its own affiliate program. The seller sets the referral percentage, and you generate a unique link to earn on every purchase from your channel.",
        },
        {
          icon: "lock",
          title: "Anti-piracy and licenses",
          text: "Files are protected by watermarks, samples are automatically secured, and after purchase you receive a generated PDF license with a transaction hash. This is clear proof of legal usage.",
        },
        {
          icon: "zap",
          title: "Fast product verification",
          text: "Every new product is reviewed by the vlnd team before it reaches buyers. This removes scams, spam, and low-quality content.",
        },
        {
          icon: "file-check",
          title: "Transparent fees",
          text: "The seller sets their net price. The buyer sees the net price plus 10%. After the transaction is confirmed, the seller receives exactly their net price, and the 10% goes toward platform maintenance, moderation, and security development.",
        },
      ],
      cta: "Browse the marketplace",
    },
  },
};

export function WelcomePopup() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "pl";
    try {
      return (localStorage.getItem(LANG_KEY) as Lang) || "pl";
    } catch {
      return "pl";
    }
  });
  const [expanded, setExpanded] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [user, loading]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  const changeLang = (next: Lang) => {
    setLang(next);
    setExpanded(false);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold">{t.title}</div>
              <div className="text-[11px] text-muted-foreground">{t.subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center rounded-md border border-border/60 bg-background/60 p-0.5 text-[11px] mr-1">
              <button
                onClick={() => changeLang("pl")}
                aria-label="Polski"
                className={`px-2 py-1 rounded-sm transition-colors ${lang === "pl" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                PL
              </button>
              <button
                onClick={() => changeLang("en")}
                aria-label="English"
                className={`px-2 py-1 rounded-sm transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                EN
              </button>
            </div>
            <button
              onClick={close}
              aria-label={t.close}
              className="text-muted-foreground hover:text-foreground rounded-md p-1 -mr-1 -mt-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-3 space-y-2.5 overflow-y-auto">
          <p className="text-xs text-muted-foreground leading-relaxed">{t.intro}</p>

          <div className="flex sm:hidden items-center gap-2 text-[11px] text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>{t.language}:</span>
            <button
              onClick={() => changeLang("pl")}
              className={`px-1.5 py-0.5 rounded ${lang === "pl" ? "bg-primary text-primary-foreground" : ""}`}
            >
              PL
            </button>
            <button
              onClick={() => changeLang("en")}
              className={`px-1.5 py-0.5 rounded ${lang === "en" ? "bg-primary text-primary-foreground" : ""}`}
            >
              EN
            </button>
          </div>

          <Row icon={<ShoppingBag className="h-3.5 w-3.5" />} title={t.rows.buy.title}>
            {t.rows.buy.text}
          </Row>
          <Row icon={<Upload className="h-3.5 w-3.5" />} title={t.rows.sell.title}>
            {t.rows.sell.text}
          </Row>
          <Row icon={<Repeat className="h-3.5 w-3.5" />} title={t.rows.swap.title}>
            {t.rows.swap.text}
          </Row>
          <Row icon={<Users className="h-3.5 w-3.5" />} title={t.rows.affiliate.title}>
            {t.rows.affiliate.text}
          </Row>
          <Row icon={<Shield className="h-3.5 w-3.5" />} title={t.rows.escrow.title}>
            {t.rows.escrow.text}
          </Row>
          <Row icon={<Percent className="h-3.5 w-3.5" />} title={t.rows.fee.title}>
            {t.rows.fee.text}
          </Row>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors pt-1"
          >
            {expanded ? t.showLess : t.learnMore}
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {expanded && (
            <div className="rounded-xl border border-border/60 bg-background/50 p-3 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">{t.expanded.title}</span>
              </div>
              {t.expanded.sections.map((section, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <ExpandedIcon name={section.icon} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight">{section.title}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      {section.text}
                    </div>
                  </div>
                </div>
              ))}
              <Button
                asChild
                size="sm"
                className="w-full bg-gradient-primary text-primary-foreground mt-1"
              >
                <Link to="/browse" onClick={close}>
                  {t.expanded.cta}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 border-t border-border/60 shrink-0">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="flex items-center gap-1.5"
            onClick={close}
          >
            <Link to="/help">
              <Headphones className="h-3.5 w-3.5" />
              {t.help}
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="flex items-center gap-1.5"
            onClick={close}
          >
            <Link to="/browse">
              <Compass className="h-3.5 w-3.5" />
              {t.browse}
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="col-span-2 bg-gradient-primary text-primary-foreground"
            onClick={close}
          >
            <Link to="/auth">{t.signup}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold leading-tight">{title}</div>
        <div className="text-[11px] text-muted-foreground leading-snug">{children}</div>
      </div>
    </div>
  );
}

function ExpandedIcon({ name }: { name: string }) {
  const className = "h-3.5 w-3.5";
  switch (name) {
    case "shield":
      return <Shield className={className} />;
    case "repeat":
      return <Repeat className={className} />;
    case "users":
      return <Users className={className} />;
    case "lock":
      return <Lock className={className} />;
    case "zap":
      return <Zap className={className} />;
    case "file-check":
      return <FileCheck className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}
