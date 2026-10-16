import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  getConnectStatus,
  getStripeDashboardLink,
  startConnectOnboarding,
} from "@/lib/connect.functions";
import { getStripeEnvironment } from "@/lib/stripe";

function safeEnv() {
  try {
    return getStripeEnvironment();
  } catch {
    return null;
  }
}

export function useConnectStatus(enabled = true) {
  const fetchStatus = useServerFn(getConnectStatus);
  const [env, setEnv] = useState<"sandbox" | "live" | null>(null);
  useEffect(() => setEnv(safeEnv()), []);
  const q = useQuery({
    queryKey: ["connect-status", env],
    enabled: enabled && !!env,
    queryFn: () => fetchStatus({ data: { environment: env! } }),
  });
  return { env, ...q };
}

export function ConnectPayoutsCard({
  compact = false,
  returnTo,
  onBeforeRedirect,
}: {
  compact?: boolean;
  returnTo?: "dashboard" | "sell";
  onBeforeRedirect?: () => Promise<unknown>;
}) {
  const { env, data: status, isLoading } = useConnectStatus();
  const qc = useQueryClient();
  const start = useServerFn(startConnectOnboarding);
  const dash = useServerFn(getStripeDashboardLink);
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    if (!env) return toast.error("Płatności nie są skonfigurowane.");
    setBusy(true);
    try {
      const res: any = await start({ data: { environment: env, returnTo } });
      if (res?.error) throw new Error(res.error);
      if (onBeforeRedirect) await onBeforeRedirect();
      window.location.href = res.url;
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się połączyć ze Stripe");
      setBusy(false);
    }
  };

  const openDashboard = async () => {
    if (!env) return;
    setBusy(true);
    try {
      const res: any = await dash({ data: { environment: env } });
      if (res?.error) throw new Error(res.error);
      window.open(res.url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się otworzyć panelu Stripe");
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ["connect-status"] });
    }
  };

  const ready = !!status?.transfersEnabled;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          {ready ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">
            {ready ? "Konto Stripe połączone" : "Połącz konto Stripe, aby otrzymywać wypłaty"}
          </h2>
          {!compact && (
            <p className="text-sm text-muted-foreground mt-1">
              Wypłaty obsługuje Stripe. Po zwolnieniu depozytu Twoja część ze sprzedaży trafia
              automatycznie na Twoje konto Stripe, a Stripe przelewa ją na Twój rachunek bankowy.
              Numer konta i weryfikację tożsamości podajesz bezpośrednio w Stripe — nie
              przechowujemy ich na vlnd.
            </p>
          )}
          {status?.connected && !ready && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" /> Dokończ weryfikację w Stripe, aby aktywować
              wypłaty.
            </p>
          )}
          {ready && !status?.payoutsEnabled && (
            <p className="mt-2 text-sm text-muted-foreground">
              Przelewy na bank aktywują się, gdy Stripe zakończy weryfikację.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!ready && (
          <Button type="button" onClick={connect} disabled={busy || isLoading}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {status?.connected ? "Dokończ konfigurację Stripe" : "Połącz konto Stripe"}
          </Button>
        )}
        {status?.connected && (
          <Button type="button" variant="outline" onClick={openDashboard} disabled={busy}>
            <ExternalLink className="h-4 w-4 mr-2" /> Panel wypłat Stripe
          </Button>
        )}
      </div>
    </div>
  );
}
