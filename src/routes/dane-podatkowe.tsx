import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { getMyDac7Status, saveTaxProfile } from "@/lib/dac7.functions";
import { DAC7_TX_REQUIRED, DAC7_PLN_REQUIRED } from "@/lib/dac7.server";

export const Route = createFileRoute("/dane-podatkowe")({
  head: () => ({
    meta: [
      { title: "Dane podatkowe (DAC7) — vlnd" },
      {
        name: "description",
        content:
          "Uzupełnij dane podatkowe wymagane przepisami DAC7 dla sprzedawców zbliżających się do progu zgłoszeniowego na vlnd.",
      },
      { property: "og:title", content: "Dane podatkowe (DAC7) — vlnd" },
      {
        property: "og:description",
        content:
          "Dlaczego platformy cyfrowe muszą raportować dane sprzedawców do organów podatkowych.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TaxDataPage,
});

type SellerKind = "private" | "business";

function ProgressBar({ pct, level }: { pct: number; level: "ok" | "warn" | "required" }) {
  const color =
    level === "required" ? "bg-destructive" : level === "warn" ? "bg-amber-500" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

function TaxDataPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getMyDac7Status);
  const submitProfile = useServerFn(saveTaxProfile);

  const [sellerKind, setSellerKind] = useState<SellerKind>("private");
  const [fullName, setFullName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("PL");
  const [tin, setTin] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [vatId, setVatId] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: status, isLoading } = useQuery({
    queryKey: ["dac7-status", user?.id],
    enabled: !!user,
    queryFn: () => fetchStatus({ data: undefined as any }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      submitProfile({
        data: {
          sellerKind,
          fullName,
          addressLine,
          city,
          postalCode,
          country,
          tin,
          dateOfBirth: sellerKind === "private" ? dateOfBirth || null : null,
          birthPlace: sellerKind === "private" ? birthPlace || null : null,
          vatId: sellerKind === "business" ? vatId || null : null,
          businessRegNo: sellerKind === "business" ? businessRegNo || null : null,
        },
      }),
    onSuccess: () => {
      toast.success("Dane podatkowe zapisane");
      qc.invalidateQueries({ queryKey: ["dac7-status"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Nie udało się zapisać danych"),
  });

  const levelBanner = useMemo(() => {
    if (!status) return null;
    if (status.level === "required") {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm">
            Przekroczono próg DAC7 ({DAC7_TX_REQUIRED} transakcji lub {DAC7_PLN_REQUIRED.toFixed(0)}{" "}
            zł w roku). Uzupełnienie danych poniżej jest wymagane, abyśmy mogli zaraportować Twoją
            sprzedaż zgodnie z przepisami.
          </p>
        </div>
      );
    }
    if (status.level === "warn") {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm">
            Zbliżasz się do progu DAC7 — warto uzupełnić dane podatkowe już teraz.
          </p>
        </div>
      );
    }
    return null;
  }, [status]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-3xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="font-display text-4xl font-bold">Dane podatkowe (DAC7)</h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Zgodnie z unijną dyrektywą DAC7 platformy internetowe, na których sprzedajesz towary lub
          usługi, mają obowiązek raportować dane sprzedawców do organów podatkowych po przekroczeniu
          progu 30 transakcji lub 2 000 EUR w roku kalendarzowym. Prosimy o uzupełnienie danych, aby
          móc kontynuować sprzedaż bez przerw.
        </p>

        <div className="mt-4 rounded-xl border border-border/40 bg-muted/30 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Dane są wykorzystywane wyłącznie do obowiązkowego raportowania podatkowego i nie są
            udostępniane publicznie ani innym użytkownikom.
          </p>
        </div>

        {!isLoading && status && (
          <div className="mt-8 space-y-4 rounded-2xl border border-border/40 bg-gradient-surface p-5">
            <h2 className="font-semibold">Twój postęp w bieżącym roku</h2>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Liczba transakcji</span>
                <span className="text-muted-foreground">
                  {status.txCount} / {DAC7_TX_REQUIRED}
                </span>
              </div>
              <ProgressBar pct={status.pctTx} level={status.level} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Kwota sprzedaży</span>
                <span className="text-muted-foreground">
                  {status.grossPln.toFixed(2)} zł / {DAC7_PLN_REQUIRED.toFixed(0)} zł
                </span>
              </div>
              <ProgressBar pct={status.pctAmount} level={status.level} />
            </div>
            {levelBanner}
          </div>
        )}

        <form
          className="mt-8 space-y-5 rounded-2xl border border-border/40 bg-gradient-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div>
            <Label>Rodzaj sprzedawcy</Label>
            <Select value={sellerKind} onValueChange={(v) => setSellerKind(v as SellerKind)}>
              <SelectTrigger className="mt-1 bg-input border-input text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Osoba prywatna</SelectItem>
                <SelectItem value="business">Działalność gospodarcza</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{sellerKind === "business" ? "Nazwa firmy" : "Imię i nazwisko"}</Label>
            <Input
              className="mt-1"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Adres (ulica i numer)</Label>
              <Input
                className="mt-1"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Miejscowość</Label>
              <Input
                className="mt-1"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Kod pocztowy</Label>
              <Input
                className="mt-1"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Kraj</Label>
              <Input
                className="mt-1"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>{sellerKind === "business" ? "NIP" : "PESEL lub NIP"}</Label>
            <Input
              className="mt-1"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="tylko cyfry"
              required
            />
          </div>

          {sellerKind === "private" ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Data urodzenia</Label>
                <Input
                  className="mt-1 bg-input border-input text-foreground"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div>
                <Label>Miejsce urodzenia</Label>
                <Input
                  className="mt-1"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>NIP UE / VAT ID (opcjonalnie)</Label>
                <Input className="mt-1" value={vatId} onChange={(e) => setVatId(e.target.value)} />
              </div>
              <div>
                <Label>Numer wpisu do CEIDG/KRS</Label>
                <Input
                  className="mt-1"
                  value={businessRegNo}
                  onChange={(e) => setBusinessRegNo(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-gradient-primary text-primary-foreground shadow-glow"
          >
            {mutation.isPending ? "Zapisywanie…" : "Zapisz dane podatkowe"}
          </Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
