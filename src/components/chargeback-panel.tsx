import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getChargebackEvidence,
  listAdminTransactions,
  type ChargebackEvidence,
} from "@/lib/chargeback.functions";

const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString("pl-PL") : "—");
const esc = (v: unknown) =>
  String(v ?? "—").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );

function buildHtml(ev: ChargebackEvidence): string {
  const downloads = ev.downloads.length
    ? ev.downloads
        .map(
          (d, i) =>
            `<tr><td>${i + 1}</td><td>${esc(fmt(d.at))}</td><td>${esc(d.ip)}</td><td class="ua">${esc(d.userAgent)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="4">Brak zarejestrowanych pobrań</td></tr>`;

  return `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<title>Raport dowodowy chargeback — ${esc(ev.transaction.id)}</title>
<style>
body{font-family:Georgia,'Times New Roman',serif;color:#111;max-width:820px;margin:32px auto;padding:0 24px;line-height:1.5}
h1{font-size:20px;margin-bottom:4px}h2{font-size:14px;margin-top:26px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #999;padding-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
td,th{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f2f2f2}.ua{font-size:10px;word-break:break-all}
.k{width:38%;background:#fafafa;font-weight:bold}
.ok{color:#0a6b2c;font-weight:bold}.no{color:#a10c0c;font-weight:bold}
.hash{font-family:monospace;font-size:11px;word-break:break-all}
footer{margin-top:32px;font-size:10px;color:#666}
@media print{body{margin:0}}
</style></head><body>
<h1>Raport dowodowy do sporu płatniczego (chargeback)</h1>
<div style="font-size:12px;color:#555">Platforma vlnd · Janusz Judek (działalność nierejestrowana) · wygenerowano ${esc(fmt(ev.generatedAt))}</div>

<h2>Transakcja</h2>
<table>
<tr><td class="k">Identyfikator transakcji</td><td class="hash">${esc(ev.transaction.id)}</td></tr>
<tr><td class="k">Produkt cyfrowy</td><td>${esc(ev.product.title)} (ID: ${esc(ev.product.id)})</td></tr>
<tr><td class="k">Kwota zapłacona przez kupującego</td><td>${esc((ev.transaction.buyerPrice ?? ev.transaction.amount).toFixed(2))} ${esc(ev.transaction.currency)}</td></tr>
<tr><td class="k">Status</td><td>${esc(ev.transaction.status)}</td></tr>
<tr><td class="k">Stripe Checkout Session</td><td class="hash">${esc(ev.transaction.stripeSessionId)}</td></tr>
<tr><td class="k">Stripe PaymentIntent</td><td class="hash">${esc(ev.transaction.stripePaymentIntentId)}</td></tr>
<tr><td class="k">Utworzenie zamówienia</td><td>${esc(fmt(ev.transaction.createdAt))}</td></tr>
<tr><td class="k">Zaksięgowanie płatności (escrow)</td><td>${esc(fmt(ev.transaction.heldAt))}</td></tr>
<tr><td class="k">Zwolnienie środków</td><td>${esc(fmt(ev.transaction.releasedAt))}</td></tr>
</table>

<h2>Strony transakcji</h2>
<table>
<tr><th>Rola</th><th>Nazwa</th><th>E-mail</th><th>ID</th></tr>
<tr><td>Kupujący</td><td>${esc(ev.buyer.name)}</td><td>${esc(ev.buyer.email)}</td><td class="hash">${esc(ev.buyer.id)}</td></tr>
<tr><td>Sprzedawca</td><td>${esc(ev.seller.name)}</td><td>${esc(ev.seller.email)}</td><td class="hash">${esc(ev.seller.id)}</td></tr>
</table>

<h2>Oświadczenie o utracie prawa odstąpienia (art. 38 pkt 13 u.p.k.)</h2>
<p style="font-size:12px">Kupujący przed dokonaniem płatności zaznaczył obowiązkowe oświadczenie:
„Wyrażam zgodę na dostarczenie treści cyfrowych przed upływem terminu do odstąpienia od umowy i przyjmuję do wiadomości,
że utracę prawo do odstąpienia z chwilą pobrania pliku."</p>
<table><tr><td class="k">Zgoda zarejestrowana</td><td class="${ev.waiverAccepted ? "ok" : "no"}">${ev.waiverAccepted ? "TAK — zapisana w dzienniku transakcji" : "BRAK WPISU"}</td></tr>
<tr><td class="k">Czas akceptacji / płatności</td><td>${esc(fmt(ev.checkout?.at))}</td></tr></table>

<h2>Dziennik adresów IP</h2>
<table>
<tr><th colspan="4">Zakup</th></tr>
<tr><td class="k">Adres IP</td><td colspan="3">${esc(ev.checkout?.ip)}</td></tr>
<tr><td class="k">Przeglądarka / system</td><td colspan="3" class="ua">${esc(ev.checkout?.userAgent)}</td></tr>
</table>
<table>
<tr><th>#</th><th>Czas pobrania pliku</th><th>Adres IP</th><th>Przeglądarka / system</th></tr>
${downloads}
</table>

<h2>Umowa licencyjna</h2>
<table><tr><td class="k">Hash umowy licencyjnej (SHA-256)</td><td class="hash">${esc(ev.licenseHash)}</td></tr></table>
<p style="font-size:12px">Hash jednoznacznie identyfikuje treść umowy licencyjnej wygenerowanej dla tej transakcji i udostępnionej kupującemu w formacie PDF.</p>

<footer>Dokument wygenerowany automatycznie z dziennika dowodowego platformy vlnd. Wpisy dziennika są zapisem tylko do odczytu, tworzonym przez system w momencie zdarzenia.</footer>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
}

export function ChargebackPanel() {
  const fetchTransactions = useServerFn(listAdminTransactions);
  const fetchEvidence = useServerFn(getChargebackEvidence);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      try {
        return await fetchTransactions({});
      } catch (e: any) {
        toast.error(e?.message ?? "Nie udało się pobrać transakcji");
        return [];
      }
    },
  });

  const generate = async (transactionId: string) => {
    setBusy(transactionId);
    try {
      const ev = await fetchEvidence({ data: { transactionId } });
      const win = window.open("", "_blank");
      if (!win) {
        toast.error("Przeglądarka zablokowała nowe okno — zezwól na wyskakujące okna.");
        return;
      }
      win.document.write(buildHtml(ev));
      win.document.close();
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się wygenerować raportu");
    } finally {
      setBusy(null);
    }
  };

  const filtered = (rows ?? []).filter(
    (r) =>
      !q.trim() ||
      r.id.includes(q.trim()) ||
      r.productTitle.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Dziennik dowodowy każdej transakcji: adresy IP zakupu i pobrania, znaczniki czasu, zgoda na
        utratę prawa odstąpienia oraz hash umowy licencyjnej. Raport otwiera się w nowej karcie
        gotowy do wydruku lub zapisu jako PDF.
      </p>
      <Input
        placeholder="Szukaj po tytule produktu lub ID transakcji…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Ładowanie…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak transakcji.</p>
      ) : (
        <div className="rounded-lg border border-border/60 divide-y divide-border/60">
          {filtered.map((t) => (
            <div key={t.id} className="p-3 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <p className="font-medium truncate">{t.productTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.createdAt).toLocaleString("pl-PL")} · {t.amount.toFixed(2)}{" "}
                  {t.currency} · {t.status} · <span className="font-mono">{t.id.slice(0, 8)}</span>
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => generate(t.id)}>
                {busy === t.id ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-1.5" />
                )}
                Generuj raport chargeback
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
