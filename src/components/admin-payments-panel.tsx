import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { listAdminPayments } from "@/lib/admin-payments.functions";

const STATUS: Record<string, { label: string; hint: string; tone: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Nieopłacone", hint: "Kupujący otworzył płatność, ale nie zapłacił (porzucone lub w trakcie).", tone: "outline" },
  held: { label: "Opłacone – depozyt", hint: "Pieniądze pobrane, kupujący ma dostęp. Czekają na zwolnienie do twórcy.", tone: "secondary" },
  released: { label: "Zwolnione", hint: "Depozyt zwolniony, środki należą się twórcy.", tone: "default" },
  completed: { label: "Zakończone", hint: "Zamówienie zakończone (np. darmowe lub rozliczone).", tone: "default" },
  disputed: { label: "Spór", hint: "Kupujący zgłosił problem — wymaga Twojej decyzji.", tone: "destructive" },
  refunded: { label: "Zwrot", hint: "Pieniądze zwrócone kupującemu.", tone: "outline" },
  failed: { label: "Nieudane", hint: "Płatność nie przeszła.", tone: "destructive" },
};
const PAYOUT: Record<string, string> = {
  pending: "Czeka na wypłatę",
  held: "Wstrzymane (depozyt)",
  queued: "W kolejce do przelewu",
  awaiting_account: "Twórca bez konta Stripe",
  not_required: "Nie dotyczy",
  refunded: "Zwrócone",
  not_applicable: "Nie dotyczy",
  processing: "W trakcie",
  transferred: "Przelane do twórcy",
  paid: "Wypłacone",
  failed: "Błąd przelewu",
  skipped: "Pominięte",
};

const money = (v: number | null | undefined, c = "PLN") =>
  `${Number(v ?? 0).toFixed(2).replace(".", ",")} ${c.toUpperCase()}`;
const dt = (v: string | null | undefined) => (v ? new Date(v).toLocaleString("pl-PL") : "—");

export function AdminPaymentsPanel() {
  const fetchPayments = useServerFn(listAdminPayments);
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => fetchPayments(),
  });
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const txs = data?.transactions ?? [];
  const stats = useMemo(() => {
    const paid = txs.filter((t) => ["held", "released", "completed", "disputed"].includes(t.status) && Number(t.amount) > 0);
    return {
      paidCount: paid.length,
      gross: paid.reduce((s, t) => s + Number(t.buyer_price ?? t.amount), 0),
      platform: paid.reduce((s, t) => s + Number(t.platform_amount), 0),
      held: txs.filter((t) => t.status === "held").reduce((s, t) => s + Number(t.seller_amount), 0),
      abandoned: txs.filter((t) => t.status === "pending").length,
      problems: txs.filter((t) => t.status === "disputed" || t.status === "failed" || t.payout_error).length,
    };
  }, [txs]);

  const shown = txs.filter((t) => {
    if (filter === "problems" ? !(t.status === "disputed" || t.status === "failed" || t.payout_error) : filter !== "all" && t.status !== filter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return [t.product_title, t.buyer?.email, t.buyer?.name, t.seller?.email, t.seller?.name, t.id, t.stripe_session_id]
      .some((x) => x?.toLowerCase().includes(s));
  });

  if (isLoading) return <p className="mt-6 text-muted-foreground">Ładowanie płatności…</p>;
  if (error) return <p className="mt-6 text-destructive">Nie udało się wczytać płatności: {(error as Error).message}</p>;

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[
          ["Opłacone zamówienia", String(stats.paidCount)],
          ["Zapłacili kupujący", money(stats.gross)],
          ["Prowizja platformy", money(stats.platform)],
          ["W depozycie dla twórców", money(stats.held)],
          ["Porzucone płatności", String(stats.abandoned)],
          ["Wymaga uwagi", String(stats.problems)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border bg-card p-3">
            <div className="text-xs text-muted-foreground">{l}</div>
            <div className="text-lg font-semibold mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[["all", "Wszystkie"], ["held", "Depozyt"], ["released", "Zwolnione"], ["pending", "Nieopłacone"], ["disputed", "Spory"], ["refunded", "Zwroty"], ["problems", "Problemy"]].map(([k, l]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{l}</Button>
        ))}
        <Input className="w-64 ml-auto" placeholder="Szukaj: produkt, e-mail, ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Odśwież
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b">
            <tr>
              <th className="p-3 w-6" /><th className="p-3">Data</th><th className="p-3">Produkt</th><th className="p-3">Kupujący</th>
              <th className="p-3">Twórca</th><th className="p-3">Kwota</th><th className="p-3">Status</th><th className="p-3">Wypłata</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Brak płatności dla tego filtra.</td></tr>
            )}
            {shown.map((t) => {
              const st = STATUS[t.status] ?? { label: t.status, hint: "", tone: "outline" as const };
              const isOpen = open === t.id;
              return (
                <Fragment key={t.id}>
                  <tr className="border-b hover:bg-muted/40 cursor-pointer" onClick={() => setOpen(isOpen ? null : t.id)}>
                    <td className="p-3">{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                    <td className="p-3 whitespace-nowrap">{dt(t.created_at)}</td>
                    <td className="p-3 max-w-[220px] truncate">{t.product_title}</td>
                    <td className="p-3">{t.buyer?.email ?? t.buyer?.name ?? "—"}</td>
                    <td className="p-3">{t.seller?.name ?? t.seller?.email ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">{money(t.buyer_price ?? t.amount, t.currency)}</td>
                    <td className="p-3"><Badge variant={st.tone} title={st.hint}>{st.label}</Badge></td>
                    <td className="p-3">
                      {t.payout_error ? <Badge variant="destructive">Błąd przelewu</Badge> : PAYOUT[t.payout_status] ?? t.payout_status}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b bg-muted/30">
                      <td colSpan={8} className="p-4">
                        <p className="mb-3 text-muted-foreground">{st.hint}</p>
                        <div className="grid gap-x-8 gap-y-1 md:grid-cols-2 text-xs">
                          <Row k="Cena twórcy" v={money(t.amount, t.currency)} />
                          <Row k="Zapłacił kupujący" v={money(t.buyer_price ?? t.amount, t.currency)} />
                          <Row k="Dla twórcy" v={money(t.seller_amount, t.currency)} />
                          <Row k="Prowizja platformy" v={money(t.platform_amount, t.currency)} />
                          <Row k="Afiliacja" v={t.affiliate ? `${money(t.affiliate_amount, t.currency)} → ${t.affiliate.name ?? t.affiliate.email}` : "—"} />
                          <Row k="Źródło" v={t.source} />
                          <Row k="Opłacone (depozyt od)" v={dt(t.held_at)} />
                          <Row k="Auto-zwolnienie" v={dt(t.auto_release_at)} />
                          <Row k="Zwolnione" v={dt(t.released_at)} />
                          <Row k="Spór" v={t.disputed_at ? `${dt(t.disputed_at)} — ${t.dispute_reason ?? ""}` : "—"} />
                          <Row k="E-mail twórcy" v={t.seller?.email ?? "—"} />
                          <Row k="Środowisko Stripe" v={t.stripe_env ?? "—"} />
                          <Row k="Sesja Stripe" v={t.stripe_session_id ?? "—"} />
                          <Row k="Płatność Stripe" v={t.stripe_payment_intent_id ?? "—"} />
                          <Row k="Przelew do twórcy" v={t.stripe_transfer_id ?? "—"} />
                          <Row k="ID zamówienia" v={t.id} />
                          {t.payout_error && <Row k="Błąd przelewu" v={t.payout_error} danger />}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Wypłaty z poleceń (afiliacja)</h3>
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b">
              <tr><th className="p-3">Data</th><th className="p-3">Osoba</th><th className="p-3">Kwota</th><th className="p-3">Status</th><th className="p-3">Szczegóły</th></tr>
            </thead>
            <tbody>
              {(data?.payouts ?? []).length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Brak wypłat z poleceń.</td></tr>
              )}
              {(data?.payouts ?? []).map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-3 whitespace-nowrap">{dt(p.created_at)}</td>
                  <td className="p-3">{p.user?.name ?? p.user?.email ?? "—"}</td>
                  <td className="p-3">{money(p.amount, p.currency)}</td>
                  <td className="p-3"><Badge variant={p.error ? "destructive" : "outline"}>{PAYOUT[p.status] ?? p.status}</Badge></td>
                  <td className="p-3 text-xs">{p.error ?? p.stripe_transfer_id ?? (p.paid_at ? `Wypłacono ${dt(p.paid_at)}` : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, danger }: { k: string; v: string; danger?: boolean }) {
  return (
    <div className="flex gap-2 py-0.5">
      <span className="text-muted-foreground w-40 shrink-0">{k}</span>
      <span className={`break-all ${danger ? "text-destructive" : ""}`}>{v}</span>
    </div>
  );
}
