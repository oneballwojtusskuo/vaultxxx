import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyTransactions } from "@/lib/purchases.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  PlayCircle,
  Trash2,
  FileText,
  AlertTriangle,
  X,
  Repeat2,
  Eye,
  EyeOff,
  Banknote,
  Link2,
  Clock3,
  WalletCards,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { generateLicensePdf } from "@/lib/license-pdf";
import { ProfileEditor } from "@/components/profile-editor";
import { getMyDac7Status } from "@/lib/dac7.functions";
import { AlertTriangle as AlertTriangleIcon } from "lucide-react";
import { OPERATOR_CONTACT } from "@/lib/operator";

const TABS = ["products", "purchases", "sales", "affiliate"] as const;
type DashboardTab = (typeof TABS)[number];

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): { tab?: DashboardTab } => {
    const tab = search.tab as DashboardTab | undefined;
    return TABS.includes(tab as DashboardTab) ? { tab } : {};
  },
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const activeTab: DashboardTab = tab ?? "products";

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: myProducts, refetch: refetchProducts } = useQuery({
    queryKey: ["my-products", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("products")
          .select("*, category:categories(name)")
          .eq("seller_id", user!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const fetchTransactions = useServerFn(getMyTransactions);
  const { data: txData } = useQuery({
    queryKey: ["my-transactions", user?.id],
    enabled: !!user,
    queryFn: async () => await fetchTransactions({ data: undefined as any }),
  });

  const purchases = txData?.purchases;
  const sales = txData?.sales?.filter((t: any) => t.source !== "exchange");
  const affiliateEarnings = txData?.affiliate;
  const affiliateTotal =
    affiliateEarnings?.reduce(
      (sum: number, tx: any) => sum + Number(tx.affiliate_amount ?? 0),
      0,
    ) ?? 0;
  const affiliateReleased =
    affiliateEarnings
      ?.filter((tx: any) => tx.status === "released" || tx.status === "completed")
      .reduce((sum: number, tx: any) => sum + Number(tx.affiliate_amount ?? 0), 0) ?? 0;
  const affiliatePending = Math.max(0, affiliateTotal - affiliateReleased);

  const requestAffiliatePayout = () => {
    if (affiliateReleased < 100) return;
    const account = window.prompt("Podaj numer rachunku bankowego do wypłaty:");
    if (!account?.trim()) return;
    const subject = encodeURIComponent("Wniosek o wypłatę prowizji afiliacyjnej");
    const body = encodeURIComponent(
      `Proszę o wypłatę prowizji afiliacyjnej. Kwota: ${affiliateReleased.toFixed(2)} PLN. Numer rachunku: ${account.trim()}.`,
    );
    window.location.href = `mailto:${OPERATOR_CONTACT}?subject=${subject}&body=${body}`;
  };

  const fetchDac7 = useServerFn(getMyDac7Status);
  const { data: dac7 } = useQuery({
    queryKey: ["dac7-status", user?.id],
    enabled: !!user,
    queryFn: () => fetchDac7({ data: undefined as any }),
  });

  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await (supabase as any)
          .from("seller_notifications")
          .select("*")
          .eq("user_id", user!.id)
          .is("read_at", null)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const dismissNotification = async (id: string) => {
    const { error } = await (supabase as any)
      .from("seller_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    refetchNotifications();
  };

  const setProductStatus = async (id: string, status: "published" | "archived") => {
    const { error } = await supabase.from("products").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(
      status === "archived" ? "Ogłoszenie zdjęte z portalu" : "Ogłoszenie ponownie opublikowane",
    );
    refetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Usunąć produkt trwale? Jeśli ma już kupujących, użyj opcji „Zdejmij".')) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      return toast.error(
        error.message.includes("cannot be deleted")
          ? "Ten produkt ma już kupujących — możesz go tylko zdjąć z portalu, żeby nie stracili dostępu."
          : error.message,
      );
    }
    toast.success("Usunięto");
    refetchProducts();
  };

  const downloadLicense = (t: any) => {
    if (!user || !t.product) return;
    generateLicensePdf({
      transactionId: t.id,
      createdAt: t.created_at,
      productTitle: t.product.title,
      productId: t.product.id,
      amount: Number(t.amount),
      currency: t.currency,
      buyerName: user.user_metadata?.display_name ?? user.email ?? "Licencjobiorca",
      buyerEmail: user.email ?? "",
      sellerName: t.product.seller?.username ?? "Sprzedawca",
      terms: t.product.license_terms ?? {},
    });
    toast.success("Licencja wygenerowana");
  };

  if (loading || !user) return null;

  const totalRevenue =
    sales?.reduce((s: number, t: any) => s + Number(t.seller_amount ?? t.amount), 0) ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">Mój panel</h1>
            <p className="text-muted-foreground mt-1">
              Zarządzaj produktami, zakupami i wymianami.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ProfileEditor />
            <Link to="/sell">
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                <Plus className="h-4 w-4 mr-1" /> Nowy produkt
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <Stat label="Moje produkty" value={myProducts?.length ?? 0} />
          <Stat label="Zakupy" value={purchases?.length ?? 0} />
          <Stat label="Przychód" value={`${totalRevenue.toFixed(2)} PLN`} />
          <Stat label="Zarobki z afiliacji" value={`${affiliateTotal.toFixed(2)} PLN`} />
        </div>

        {notifications && notifications.length > 0 && (
          <div className="mt-8 space-y-3">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  n.kind === "product_published"
                    ? "border-success/40 bg-success/10"
                    : n.kind === "product_review_required"
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-destructive/40 bg-destructive/10"
                }`}
              >
                {n.kind === "product_published" ? (
                  <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">
                    {n.kind === "product_published"
                      ? "Produkt został opublikowany."
                      : n.kind === "product_review_required"
                        ? "Produkt oczekuje na weryfikację administratora."
                        : `Twoje ogłoszenie${n.product_title ? ` „${n.product_title}"` : ""} zostało odrzucone lub usunięte.`}
                  </p>
                  {n.admin_note && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      <span className="font-medium text-foreground">Powód:</span> {n.admin_note}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString("pl-PL")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => dismissNotification(n.id)}
                  aria-label="Odrzuć"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {dac7 && dac7.level !== "ok" && (
          <div
            className={`mt-8 rounded-2xl border p-5 space-y-3 ${
              dac7.level === "required"
                ? "border-destructive/40 bg-destructive/10"
                : "border-amber-500/40 bg-amber-500/10"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangleIcon
                className={`h-5 w-5 shrink-0 mt-0.5 ${dac7.level === "required" ? "text-destructive" : "text-amber-600"}`}
              />
              <div className="flex-1">
                <p className="font-semibold">
                  {dac7.level === "required"
                    ? "Wymagane dane podatkowe (DAC7)"
                    : "Zbliżasz się do progu — uzupełnij dane podatkowe"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {dac7.level === "required"
                    ? "Przekroczono roczny próg DAC7. Uzupełnij dane podatkowe, aby móc kontynuować sprzedaż."
                    : "Po przekroczeniu 30 transakcji lub 2 000 EUR w roku musimy zgłosić Twoją sprzedaż do urzędu skarbowego."}
                </p>
              </div>
              <Link to="/dane-podatkowe">
                <Button size="sm" variant={dac7.level === "required" ? "destructive" : "outline"}>
                  Uzupełnij dane
                </Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                  <span>Transakcje</span>
                  <span>{dac7.txCount}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${dac7.level === "required" ? "bg-destructive" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, dac7.pctTx)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                  <span>Kwota sprzedaży</span>
                  <span>{dac7.grossPln.toFixed(0)} zł</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${dac7.level === "required" ? "bg-destructive" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, dac7.pctAmount)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            navigate({ to: "/dashboard", search: { tab: v as DashboardTab }, replace: true })
          }
          className="mt-10"
        >
          <TabsList>
            <TabsTrigger value="products">Moje produkty</TabsTrigger>
            <TabsTrigger value="purchases">Zakupy</TabsTrigger>
            <TabsTrigger value="sales">Sprzedaż</TabsTrigger>
            <TabsTrigger value="affiliate">Afiliacja</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6 space-y-3">
            {myProducts?.length === 0 && <Empty msg="Nie masz jeszcze produktów" />}
            {myProducts?.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl bg-gradient-surface border border-border/40 p-4"
              >
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  {p.preview_url ? (
                    <img src={p.preview_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary opacity-40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to="/product/$id"
                      params={{ id: p.id }}
                      className="font-semibold hover:text-primary line-clamp-1"
                    >
                      {p.title}
                    </Link>
                    {p.status === "archived" && (
                      <span className="rounded-full border border-muted-foreground/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                        zdjęte z portalu
                      </span>
                    )}
                    {p.status === "pending_review" && (
                      <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                        oczekuje na weryfikację
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Number(p.price).toFixed(2)} {p.currency} netto (kupujący widzi +10%) ·{" "}
                    {p.downloads_count} pobrań
                  </p>
                  {p.status === "archived" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Osoby, które już kupiły, zachowują pełny dostęp do pliku i licencji.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.status === "published" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductStatus(p.id, "archived")}
                    >
                      <EyeOff className="h-4 w-4 mr-1" /> Zdejmij
                    </Button>
                  )}
                  {p.status === "archived" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductStatus(p.id, "published")}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Przywróć
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteProduct(p.id)}
                    aria-label="Usuń trwale"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="purchases" className="mt-6 space-y-3">
            {purchases?.length === 0 && <Empty msg="Brak zakupów" />}
            {purchases?.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center gap-4 rounded-xl bg-gradient-surface border border-border/40 p-4"
              >
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  {t.product?.preview_url ? (
                    <img
                      src={t.product.preview_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary opacity-40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold line-clamp-1">{t.product?.title}</p>
                    {t.source === "exchange" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                        <Repeat2 className="h-3 w-3" /> z wymiany
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.source === "exchange"
                      ? "Otrzymane w ramach wymiany"
                      : `${Number(t.amount).toFixed(2)} ${t.currency}`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Link to="/product/$id" params={{ id: t.product?.id ?? "" }}>
                    <Button size="sm" variant="outline">
                      <PlayCircle className="h-4 w-4 mr-1" /> Odtwórz
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => downloadLicense(t)}>
                    <FileText className="h-4 w-4 mr-1" /> Licencja PDF
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="sales" className="mt-6 space-y-3">
            {sales?.length === 0 && <Empty msg="Brak sprzedaży" />}
            {sales?.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl bg-gradient-surface border border-border/40 p-4"
              >
                <div>
                  <p className="font-semibold">{t.product?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(t.created_at).toLocaleString("pl-PL")} · {statusLabel(t.status)}
                  </p>
                </div>
                <span
                  className={`font-bold ${t.status === "released" || t.status === "completed" ? "text-gradient" : "text-muted-foreground"}`}
                >
                  +{Number(t.seller_amount ?? t.amount).toFixed(2)} {t.currency}
                </span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="affiliate" className="mt-6 space-y-3">
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Program partnerski</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Polecaj produkty z aktywną prowizją. Na stronie produktu wybierz „Generuj link
                    polecający”, a następnie udostępnij go w swoich kanałach.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <AffiliateStep number="1" title="Wygeneruj link">
                  Link przypisuje sprzedaż do Ciebie przez 30 dni.
                </AffiliateStep>
                <AffiliateStep number="2" title="Polecaj produkt">
                  Po zakupie prowizja pojawi się w historii.
                </AffiliateStep>
                <AffiliateStep number="3" title="Odbierz środki">
                  Po zwolnieniu escrow środki liczą się do wypłaty.
                </AffiliateStep>
              </div>
              <p className="text-xs text-muted-foreground">
                Przychody afiliacyjne rozliczasz samodzielnie w PIT. Platforma nie rozlicza za
                Ciebie podatków. Przy osiągnięciu co najmniej 30 wypłat lub równowartości 2 000 EUR
                dane mogą podlegać raportowaniu DAC7.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <AffiliateStat
                icon={<WalletCards className="h-4 w-4" />}
                label="Łącznie naliczone"
                value={`${affiliateTotal.toFixed(2)} PLN`}
              />
              <AffiliateStat
                icon={<Clock3 className="h-4 w-4" />}
                label="W depozycie"
                value={`${affiliatePending.toFixed(2)} PLN`}
              />
              <AffiliateStat
                icon={<Banknote className="h-4 w-4" />}
                label="Dostępne"
                value={`${affiliateReleased.toFixed(2)} PLN`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/40 bg-gradient-surface p-4">
              <div className="text-sm text-muted-foreground">
                <p>
                  Minimalny próg wypłaty: <strong className="text-foreground">100,00 PLN</strong>
                </p>
                <p className="text-xs mt-1">
                  Numer rachunku podasz dopiero przy składaniu wniosku.
                </p>
              </div>
              <Button onClick={requestAffiliatePayout} disabled={affiliateReleased < 100}>
                <Banknote className="h-4 w-4 mr-2" /> Wypłać środki
              </Button>
            </div>
            {(!affiliateEarnings || affiliateEarnings.length === 0) && (
              <Empty msg="Brak zarobków z afiliacji" />
            )}
            {affiliateEarnings?.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl bg-gradient-surface border border-border/40 p-4 gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold line-clamp-1">{t.product?.title ?? "Produkt"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(t.created_at).toLocaleString("pl-PL")} · prowizja{" "}
                    {t.affiliate_commission_pct}% · status {statusLabel(t.status)}
                  </p>
                </div>
                <span
                  className={`font-bold ${t.status === "released" || t.status === "completed" ? "text-gradient" : "text-muted-foreground"}`}
                >
                  +{Number(t.affiliate_amount).toFixed(2)} {t.currency}
                </span>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function AffiliateStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {number}
        </span>
        <span className="font-medium">{title}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function AffiliateStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-gradient-surface p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "released":
    case "completed":
      return "wypłacone";
    case "held":
      return "w depozycie";
    case "disputed":
      return "zgłoszony problem";
    case "pending":
      return "oczekuje na płatność";
    case "failed":
      return "nieudane";
    case "refunded":
      return "zwrot";
    default:
      return status;
  }
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-gradient-surface border border-border/40 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-display text-3xl font-bold mt-1 text-gradient">{value}</p>
    </div>
  );
}
function Empty({ msg }: { msg: string }) {
  return (
    <div className="text-center text-muted-foreground py-12 rounded-xl border border-dashed border-border/50">
      {msg}
    </div>
  );
}
