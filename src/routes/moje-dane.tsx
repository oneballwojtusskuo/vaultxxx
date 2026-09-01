import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { openCookieSettings } from "@/components/cookie-banner";
import { useAuth } from "@/hooks/use-auth";
import { exportMyData, createPrivacyRequest, getMyPrivacyRequests } from "@/lib/privacy.functions";

export const Route = createFileRoute("/moje-dane")({
  head: () => ({
    meta: [
      { title: "Moje dane i prywatność — vlnd" },
      {
        name: "description",
        content:
          "Pobierz kopię swoich danych, złóż wniosek RODO o sprostowanie lub usunięcie konta i zarządzaj zgodami na cookies w vlnd.",
      },
      { property: "og:title", content: "Moje dane i prywatność — vlnd" },
      {
        property: "og:description",
        content: "Eksport danych, wnioski RODO i zarządzanie zgodami w marketplace vlnd.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyDataPage,
});

const KIND_LABELS: Record<string, string> = {
  export: "Kopia danych (art. 15)",
  rectification: "Sprostowanie danych (art. 16)",
  erasure: "Usunięcie konta i danych (art. 17)",
  restriction: "Ograniczenie przetwarzania (art. 18)",
  portability: "Przeniesienie danych (art. 20)",
  objection: "Sprzeciw wobec przetwarzania (art. 21)",
};

function MyDataPage() {
  const { user, loading } = useAuth();
  const runExport = useServerFn(exportMyData);
  const runRequest = useServerFn(createPrivacyRequest);
  const [kind, setKind] = useState<string>("erasure");
  const [details, setDetails] = useState("");

  const { data: requests, refetch } = useQuery({
    queryKey: ["privacy-requests", user?.id],
    enabled: !!user,
    queryFn: () => getMyPrivacyRequests(),
  });

  const exportMutation = useMutation({
    mutationFn: () => runExport({} as never),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vlnd-moje-dane-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Kopia Twoich danych została pobrana");
    },
    onError: () => toast.error("Nie udało się przygotować kopii danych"),
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      runRequest({ data: { kind: kind as never, details: details.trim() || undefined } }),
    onSuccess: () => {
      setDetails("");
      toast.success("Wniosek został zarejestrowany. Odpowiemy w ciągu 30 dni.");
      refetch();
    },
    onError: () => toast.error("Nie udało się wysłać wniosku"),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-bold">Moje dane i prywatność</h1>
          <p className="text-muted-foreground text-sm">
            Realizujemy prawa z RODO. Tutaj pobierzesz kopię swoich danych, złożysz wniosek o ich
            sprostowanie lub usunięcie oraz zmienisz zgody na cookies. Szczegóły znajdziesz w{" "}
            <Link to="/polityka-prywatnosci" className="text-accent hover:underline">
              polityce prywatności
            </Link>
            .
          </p>
        </header>

        {!user && !loading ? (
          <div className="rounded-xl border border-border/40 bg-gradient-surface p-6 text-sm">
            Zaloguj się, aby pobrać dane lub złożyć wniosek.{" "}
            <Link to="/auth" className="text-accent hover:underline">
              Przejdź do logowania
            </Link>
            . Wniosek możesz też wysłać na{" "}
            <a href="mailto:vlndmarketplace@gmail.com" className="text-accent hover:underline">
              vlndmarketplace@gmail.com
            </a>
            .
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-border/40 bg-gradient-surface p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-accent" />
                <h2 className="font-semibold">Pobierz kopię swoich danych</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Plik JSON zawiera profil, produkty, zakupy i sprzedaże, opinie, historię zgód oraz
                wnioski RODO.
              </p>
              <Button
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                className="bg-gradient-primary text-primary-foreground shadow-glow"
              >
                {exportMutation.isPending ? "Przygotowuję…" : "Pobierz moje dane (JSON)"}
              </Button>
            </section>

            <section className="rounded-xl border border-border/40 bg-gradient-surface p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <h2 className="font-semibold">Wniosek RODO</h2>
              </div>
              <div className="space-y-2">
                <Label>Rodzaj wniosku</Label>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger className="bg-input border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KIND_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Szczegóły (opcjonalnie)</Label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={2000}
                  placeholder="Opisz czego dotyczy wniosek…"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Uwaga: dane rozliczeniowe transakcji przechowujemy przez okres wymagany przepisami
                podatkowymi, nawet po usunięciu konta.
              </p>
              <Button
                onClick={() => requestMutation.mutate()}
                disabled={requestMutation.isPending}
                variant="outline"
              >
                Wyślij wniosek
              </Button>

              {requests && requests.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">Twoje wnioski</p>
                  {requests.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border/40 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span>{KIND_LABELS[r.kind] ?? r.kind}</span>
                        <span className="text-xs text-muted-foreground">{r.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("pl-PL")}
                      </p>
                      {r.admin_notes && <p className="text-xs mt-1">Odpowiedź: {r.admin_notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <section className="rounded-xl border border-border/40 bg-gradient-surface p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="font-semibold">Zgody na cookies</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            W każdej chwili możesz zmienić lub wycofać zgody na cookies funkcjonalne, analityczne,
            afiliacyjne i marketingowe.
          </p>
          <Button variant="outline" onClick={openCookieSettings}>
            Zmień ustawienia cookies
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
