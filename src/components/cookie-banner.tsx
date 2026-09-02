import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase-browser";

export const COOKIE_BANNER_VERSION = "2026-02";
const STORAGE_KEY = "vlnd_cookie_consent_v2";

export type CookiePrefs = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  affiliation: boolean;
};

const ALL_OFF: CookiePrefs = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  affiliation: false,
};

export function getCookiePrefs(): CookiePrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: string; prefs?: CookiePrefs };
    if (parsed.version !== COOKIE_BANNER_VERSION || !parsed.prefs) return null;
    return { ...ALL_OFF, ...parsed.prefs, necessary: true };
  } catch {
    return null;
  }
}

/** Affiliate cookies are only allowed once the visitor opted in. */
export function affiliationCookiesAllowed(): boolean {
  return getCookiePrefs()?.affiliation === true;
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("vlnd:open-cookie-settings"));
}

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(ALL_OFF);

  useEffect(() => {
    const stored = getCookiePrefs();
    if (!stored) setOpen(true);
    else setPrefs(stored);

    const reopen = () => {
      setPrefs(getCookiePrefs() ?? ALL_OFF);
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener("vlnd:open-cookie-settings", reopen);
    return () => window.removeEventListener("vlnd:open-cookie-settings", reopen);
  }, []);

  const persist = async (value: CookiePrefs) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: COOKIE_BANNER_VERSION,
        prefs: value,
        at: new Date().toISOString(),
      }),
    );
    setOpen(false);
    setDetails(false);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("cookie_consents").insert({
        user_id: data.user.id,
        banner_version: COOKIE_BANNER_VERSION,
        necessary: true,
        functional: value.functional,
        analytics: value.analytics,
        marketing: value.marketing,
        affiliation: value.affiliation,
      });
    }
  };

  if (!open) return null;

  const rows: { key: keyof Omit<CookiePrefs, "necessary">; label: string; desc: string }[] = [
    {
      key: "functional",
      label: "Funkcjonalne",
      desc: "Zapamiętują język, zamknięte okna i preferencje odtwarzacza.",
    },
    {
      key: "analytics",
      label: "Analityczne",
      desc: "Statystyki odwiedzin i wydajności serwisu (dane zbiorcze).",
    },
    {
      key: "affiliation",
      label: "Afiliacyjne",
      desc: "Przypisują sprzedaż osobie polecającej przez 30 dni.",
    },
    {
      key: "marketing",
      label: "Marketingowe",
      desc: "Dopasowanie treści promocyjnych i remarketing.",
    },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl glass border border-border/50 shadow-elevated p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Cookie className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-semibold">Pliki cookies</p>
              <p className="text-sm text-muted-foreground">
                Używamy plików cookies niezbędnych do działania vlnd oraz — za Twoją zgodą —
                funkcjonalnych, analitycznych, afiliacyjnych i marketingowych. Zgodę możesz w każdej
                chwili wycofać.{" "}
                <Link to="/polityka-prywatnosci" className="text-accent hover:underline">
                  Polityka prywatności i cookies
                </Link>
                .
              </p>
            </div>

            {details && (
              <div className="space-y-3 rounded-xl border border-border/40 bg-background/40 p-3">
                <div className="flex items-center justify-between gap-4 opacity-70">
                  <div>
                    <Label className="text-sm">Niezbędne</Label>
                    <p className="text-xs text-muted-foreground">
                      Logowanie, bezpieczeństwo, koszyk i płatności. Zawsze aktywne.
                    </p>
                  </div>
                  <Switch checked disabled />
                </div>
                {rows.map((r) => (
                  <div key={r.key} className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-sm">{r.label}</Label>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                    <Switch
                      checked={prefs[r.key]}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, [r.key]: v }))}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-gradient-primary text-primary-foreground shadow-glow"
                onClick={() =>
                  persist({
                    necessary: true,
                    functional: true,
                    analytics: true,
                    marketing: true,
                    affiliation: true,
                  })
                }
              >
                Akceptuję wszystkie
              </Button>
              <Button variant="outline" onClick={() => persist(ALL_OFF)}>
                Tylko niezbędne
              </Button>
              {details ? (
                <Button variant="ghost" onClick={() => persist(prefs)}>
                  Zapisz mój wybór
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setDetails(true)}>
                  Ustawienia
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
