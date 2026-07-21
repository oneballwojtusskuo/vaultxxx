import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Shield, Repeat, Users, Percent, X, Upload, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_KEY = "vlnd_welcome_seen_v1";

export function WelcomePopup() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold">Sprawdź jak to działa</div>
              <div className="text-[11px] text-muted-foreground">Krótki przewodnik po vlnd</div>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Zamknij"
            className="text-muted-foreground hover:text-foreground rounded-md p-1 -mr-1 -mt-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-3 space-y-2.5">
          <Row icon={<ShoppingBag className="h-3.5 w-3.5" />} title="Kupuj cyfrowe pliki">
            Grafika, muzyka, e‑booki, kod, kursy, modele 3D — od twórców, nie od korporacji.
          </Row>
          <Row icon={<Upload className="h-3.5 w-3.5" />} title="Sprzedawaj w kilka minut">
            Wgraj plik, okładkę i próbkę ze znakiem wodnym, ustaw cenę i licencję — gotowe.
          </Row>
          <Row icon={<Repeat className="h-3.5 w-3.5" />} title="Wymieniaj się bez pieniędzy">
            Zaproponuj wymianę plik‑za‑plik. Dostęp odblokowuje się po obustronnym potwierdzeniu.
          </Row>
          <Row icon={<Users className="h-3.5 w-3.5" />} title="Zarabiaj na afiliacji">
            Udostępniaj linki polecające i zgarniaj % od każdej sprzedaży z Twojego linku.
          </Row>
          <Row icon={<Shield className="h-3.5 w-3.5" />} title="Bezpieczeństwo (Escrow)">
            Pieniądze trafiają do depozytu — sprzedawca dostaje wypłatę dopiero po Twoim potwierdzeniu odbioru pliku. Pliki chronione znakiem wodnym i podpisanymi linkami.
          </Row>
          <Row icon={<Percent className="h-3.5 w-3.5" />} title="Uczciwa prowizja">
            vlnd dolicza tylko 10% do ceny sprzedawcy — reszta trafia w całości do twórcy.
          </Row>
        </div>

        <div className="flex items-center gap-2 p-3 border-t border-border/60">
          <Button asChild size="sm" variant="ghost" className="flex-1" onClick={close}>
            <Link to="/help">Dowiedz się więcej</Link>
          </Button>
          <Button asChild size="sm" className="flex-1 bg-gradient-primary text-primary-foreground" onClick={close}>
            <Link to="/auth">Załóż konto</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
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
