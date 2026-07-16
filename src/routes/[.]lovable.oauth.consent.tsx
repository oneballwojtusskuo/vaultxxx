import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type AuthDetails = {
  client?: { name?: string; redirect_uri?: string; client_uri?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};

// Local typed wrapper for the beta `auth.oauth` namespace.
type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
};
const oauth = () =>
  (supabase.auth as unknown as { oauth: OAuthNs }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md rounded-2xl glass border border-border/40 p-6 text-center">
        <h1 className="font-display text-xl font-bold mb-2">Nie można wczytać zgody</h1>
        <p className="text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Serwer autoryzacji nie zwrócił adresu przekierowania.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "aplikacji zewnętrznej";
  const redirectUri = details?.client?.redirect_uri;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-hero">
      <div className="w-full max-w-md rounded-2xl glass border border-border/40 p-6 shadow-elevated">
        <h1 className="font-display text-xl font-bold mb-2">
          Połącz <span className="text-gradient">{clientName}</span> z VaultX
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Ta aplikacja będzie mogła używać VaultX jako Ty — czytać Twoje produkty,
          zakupy i katalog za pomocą włączonych narzędzi MCP.
        </p>
        {redirectUri && (
          <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground mb-4 break-all">
            Przekierowanie po zgodzie: <span className="font-mono">{redirectUri}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground mb-6">
          To nie omija uprawnień VaultX ani polityk backendu. Możesz cofnąć dostęp w każdej chwili.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive mb-3">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <Button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 bg-gradient-primary text-primary-foreground shadow-glow"
          >
            Zezwól
          </Button>
          <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">
            Odmów
          </Button>
        </div>
      </div>
    </main>
  );
}
