import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  FileText,
  Download,
  Flag,
  Ban,
  Trash2,
  UserCheck,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { getAdminProductFileUrl, listAdminProducts, moderateProduct } from "@/lib/admin.functions";
import {
  listReports,
  updateReportStatus,
  takedownProduct,
  setUserBan,
} from "@/lib/reports.functions";
import { getDac7Participants, getOwnerRevenueStats } from "@/lib/dac7.functions";
import { listDisputeThreads } from "@/lib/dispute.functions";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  preview_url: string | null;
  sample_url: string | null;
  has_file: boolean;
  seller_id: string;
  tags: string[] | null;
  review_notes: string | null;
};

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchAdminProducts = useServerFn(listAdminProducts);

  const updateProductStatus = useServerFn(moderateProduct);
  const getProductFileUrl = useServerFn(getAdminProductFileUrl);
  const [filter, setFilter] = useState<
    "pending_review" | "published" | "archived" | "rejected" | "all"
  >("pending_review");
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products", filter],
    enabled: !!user,
    queryFn: async () => {
      try {
        const rows = await fetchAdminProducts({ data: { filter } });
        return (rows ?? []) as ProductRow[];
      } catch (e: any) {
        toast.error(e?.message ?? "Nie udało się załadować produktów");
        return [] as ProductRow[];
      }
    },
  });

  const moderate = async (id: string, newStatus: "published" | "archived" | "rejected") => {
    try {
      await updateProductStatus({
        data: { productId: id, status: newStatus, reviewNotes: notes[id] ?? null },
      });
      toast.success(
        newStatus === "published"
          ? "Zatwierdzono"
          : newStatus === "archived"
            ? "Zdjęto ogłoszenie"
            : "Odrzucono",
      );
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się zmienić statusu produktu");
    }
  };

  const signFile = async (productId: string) => {
    try {
      const data = await getProductFileUrl({ data: { productId } });
      for (const file of data.files ?? [{ url: data.url }]) window.open(file.url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się pobrać pliku");
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-6xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="font-display text-4xl font-bold">Panel administratora</h1>
        </div>
        <p className="text-muted-foreground mt-1">Moderacja produktów cyfrowych.</p>

        {
          <Tabs defaultValue="products" className="mt-6">
            <TabsList>
              <TabsTrigger value="products">
                <ShieldCheck className="h-4 w-4 mr-1.5" /> Produkty
              </TabsTrigger>
              <TabsTrigger value="reports">
                <Flag className="h-4 w-4 mr-1.5" /> Zgłoszenia
              </TabsTrigger>
              <TabsTrigger value="disputes">
                <MessageSquare className="h-4 w-4 mr-1.5" /> Spory
              </TabsTrigger>
              <TabsTrigger value="tax">
                <Wallet className="h-4 w-4 mr-1.5" /> Przychody i progi podatkowe
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <div className="mt-4 flex flex-wrap gap-2">
                {(["pending_review", "published", "archived", "rejected", "all"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        filter === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {s === "pending_review"
                        ? "Oczekujące"
                        : s === "published"
                          ? "Opublikowane"
                          : s === "archived"
                            ? "Zdjęte"
                            : s === "rejected"
                              ? "Odrzucone"
                              : "Wszystkie"}
                    </button>
                  ),
                )}
              </div>

              <div className="mt-6 space-y-4">
                {loadingProducts ? (
                  <div className="text-muted-foreground">Ładowanie...</div>
                ) : !products || products.length === 0 ? (
                  <div className="text-muted-foreground py-10 text-center">
                    Brak produktów w tej kategorii.
                  </div>
                ) : (
                  products.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-border/40 bg-gradient-surface p-5"
                    >
                      <div className="flex flex-col md:flex-row gap-5">
                        {p.preview_url ? (
                          <img
                            src={p.preview_url}
                            alt={p.title}
                            className="w-full md:w-48 h-32 object-cover rounded-lg border border-border/40"
                          />
                        ) : (
                          <div className="w-full md:w-48 h-32 rounded-lg border border-border/40 bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                            brak okładki
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-lg">{p.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {p.price.toFixed(2)} {p.currency} ·{" "}
                                {new Date(p.created_at).toLocaleString("pl-PL")}
                              </p>
                            </div>
                            <Badge
                              variant={
                                p.status === "published"
                                  ? "default"
                                  : p.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {p.status}
                            </Badge>
                          </div>
                          {p.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                              {p.description}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <Link
                              to="/product/$id"
                              params={{ id: p.id }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/50"
                            >
                              <ExternalLink className="h-3 w-3" /> Podgląd strony
                            </Link>
                            {p.sample_url && (
                              <a
                                href={p.sample_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/50"
                              >
                                <FileText className="h-3 w-3" /> Próbka
                              </a>
                            )}
                            {p.has_file && (
                              <button
                                onClick={() => signFile(p.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/50"
                              >
                                <Download className="h-3 w-3" /> Pobierz plik do weryfikacji
                              </button>
                            )}
                          </div>
                          {p.review_notes && (
                            <p className="text-xs mt-2 text-muted-foreground">
                              <span className="font-semibold">Notatka:</span> {p.review_notes}
                            </p>
                          )}
                          <div className="mt-4 space-y-2">
                            <Textarea
                              rows={2}
                              placeholder="Notatka dla sprzedawcy (opcjonalna)"
                              value={notes[p.id] ?? ""}
                              onChange={(e) => setNotes((s) => ({ ...s, [p.id]: e.target.value }))}
                            />
                            <div className="flex gap-2">
                              {p.status === "pending_review" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => moderate(p.id, "published")}
                                    className="bg-gradient-primary text-primary-foreground shadow-glow"
                                  >
                                    <Check className="h-4 w-4 mr-1" /> Zatwierdź
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => moderate(p.id, "rejected")}
                                  >
                                    <X className="h-4 w-4 mr-1" /> Odrzuć
                                  </Button>
                                </>
                              )}
                              {p.status === "published" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => moderate(p.id, "archived")}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Zdejmij ogłoszenie
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <ReportsPanel />
            </TabsContent>

            <TabsContent value="disputes">
              <DisputesPanel />
            </TabsContent>

            <TabsContent value="tax">
              <TaxRevenuePanel />
            </TabsContent>
          </Tabs>
        }
      </main>
      <SiteFooter />
    </div>
  );
}

function DisputesPanel() {
  const fetchDisputes = useServerFn(listDisputeThreads);
  const {
    data: threads,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-open-disputes"],
    queryFn: () => fetchDisputes({ data: undefined }),
  });
  const openThreads = (threads ?? []).filter(
    (thread: any) =>
      thread.status === "open" && (thread.tx_status === "held" || thread.tx_status === "disputed"),
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-semibold">Otwarte spory</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Wszystkie aktywne rozmowy kupujących, sprzedawców i administratora.
          </p>
        </div>
        <Badge variant="secondary">{openThreads.length} otwartych</Badge>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">Ładowanie sporów...</p>
      ) : error ? (
        <p className="py-10 text-center text-destructive">Nie udało się załadować sporów.</p>
      ) : openThreads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 py-12 text-center text-muted-foreground">
          Brak otwartych sporów.
        </div>
      ) : (
        openThreads.map((thread: any) => (
          <div
            key={thread.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/40 bg-gradient-surface p-4"
          >
            <div className="min-w-0">
              <p className="font-semibold truncate">{thread.product?.title ?? "Produkt cyfrowy"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Kupujący: {thread.buyer?.display_name ?? thread.buyer?.username ?? "Użytkownik"} ·
                Sprzedawca: {thread.seller?.display_name ?? thread.seller?.username ?? "Użytkownik"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(thread.created_at).toLocaleString("pl-PL")} · {thread.tx_status}
              </p>
              {thread.dispute_reason && (
                <p className="mt-2 line-clamp-2 text-sm text-foreground/75">
                  {thread.dispute_reason}
                </p>
              )}
            </div>
            <Link to="/spory/$transactionId" params={{ transactionId: thread.transaction_id }}>
              <Button size="sm" className="bg-gradient-primary text-primary-foreground">
                <MessageSquare className="h-4 w-4 mr-1.5" /> Otwórz spór
              </Button>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}

type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: "product" | "user";
  target_id: string;
  reason: string;
  description: string | null;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  admin_notes: string | null;
  created_at: string;
  reporter: { id: string; display_name: string | null; username: string | null } | null;
  product: { id: string; title: string; status: string; seller_id: string } | null;
  user_target: {
    id: string;
    display_name: string | null;
    username: string | null;
    is_banned: boolean;
  } | null;
};

function ReportsPanel() {
  const qc = useQueryClient();
  const fetchReports = useServerFn(listReports);
  const updateStatus = useServerFn(updateReportStatus);
  const takedown = useServerFn(takedownProduct);
  const ban = useServerFn(setUserBan);
  const [status, setStatus] = useState<"pending" | "reviewing" | "resolved" | "dismissed" | "all">(
    "pending",
  );
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: async () => {
      try {
        return (await fetchReports({ data: { status } })) as ReportRow[];
      } catch (e: any) {
        toast.error(e?.message ?? "Nie udało się załadować zgłoszeń");
        return [] as ReportRow[];
      }
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-reports"] });

  const setRStatus = async (id: string, s: "reviewing" | "resolved" | "dismissed") => {
    try {
      await updateStatus({ data: { reportId: id, status: s, adminNotes: adminNotes[id] ?? null } });
      toast.success("Zaktualizowano status zgłoszenia");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Błąd");
    }
  };

  const doTakedown = async (productId: string, reportId: string) => {
    if (!confirm("Zdjąć to ogłoszenie?")) return;
    try {
      await takedown({ data: { productId, reason: adminNotes[reportId] || undefined } });
      await updateStatus({
        data: { reportId, status: "resolved", adminNotes: adminNotes[reportId] ?? "Zdjęte" },
      });
      toast.success("Ogłoszenie zdjęte");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Błąd");
    }
  };

  const doBan = async (userId: string, banned: boolean, reportId?: string) => {
    if (!confirm(banned ? "Zablokować tego użytkownika?" : "Odblokować tego użytkownika?")) return;
    try {
      await ban({ data: { userId, banned } });
      if (reportId && banned) {
        await updateStatus({
          data: {
            reportId,
            status: "resolved",
            adminNotes: adminNotes[reportId] ?? "Użytkownik zablokowany",
          },
        });
      }
      toast.success(banned ? "Użytkownik zablokowany" : "Użytkownik odblokowany");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Błąd");
    }
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {(["pending", "reviewing", "resolved", "dismissed", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              status === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            {s === "pending"
              ? "Nowe"
              : s === "reviewing"
                ? "W toku"
                : s === "resolved"
                  ? "Rozwiązane"
                  : s === "dismissed"
                    ? "Odrzucone"
                    : "Wszystkie"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground">Ładowanie zgłoszeń...</div>
        ) : !reports || reports.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center">
            Brak zgłoszeń w tej kategorii.
          </div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/40 bg-gradient-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={r.target_type === "product" ? "secondary" : "outline"}>
                      {r.target_type === "product" ? "Produkt" : "Użytkownik"}
                    </Badge>
                    <span className="font-semibold">{r.reason}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(r.created_at).toLocaleString("pl-PL")} · zgłoszone przez{" "}
                    <span className="font-medium">
                      @{r.reporter?.username ?? r.reporter_id.slice(0, 8)}
                    </span>
                  </p>
                </div>
                <Badge
                  variant={
                    r.status === "resolved"
                      ? "default"
                      : r.status === "dismissed"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {r.status}
                </Badge>
              </div>

              {r.description && (
                <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">
                  {r.description}
                </p>
              )}

              <div className="mt-4 rounded-lg border border-border/40 bg-background/40 p-3 text-sm">
                {r.target_type === "product" ? (
                  r.product ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{r.product.title}</p>
                        <p className="text-xs text-muted-foreground">status: {r.product.status}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to="/product/$id"
                          params={{ id: r.product.id }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/50 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" /> Zobacz
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => doTakedown(r.product!.id, r.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Zdejmij ogłoszenie
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => doBan(r.product!.seller_id, true, r.id)}
                        >
                          <Ban className="h-4 w-4 mr-1" /> Zablokuj sprzedawcę
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Produkt nie istnieje już w bazie.
                    </p>
                  )
                ) : r.user_target ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {r.user_target.display_name ?? r.user_target.username ?? r.user_target.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{r.user_target.username ?? "—"}{" "}
                        {r.user_target.is_banned && "· ZABLOKOWANY"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.user_target.is_banned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => doBan(r.user_target!.id, false, r.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" /> Odblokuj
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => doBan(r.user_target!.id, true, r.id)}
                        >
                          <Ban className="h-4 w-4 mr-1" /> Zablokuj użytkownika
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Profil nie istnieje już w bazie.</p>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Textarea
                  rows={2}
                  placeholder="Notatka administratora (opcjonalna)"
                  value={adminNotes[r.id] ?? r.admin_notes ?? ""}
                  onChange={(e) => setAdminNotes((s) => ({ ...s, [r.id]: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setRStatus(r.id, "reviewing")}>
                    W toku
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-primary text-primary-foreground"
                    onClick={() => setRStatus(r.id, "resolved")}
                  >
                    <Check className="h-4 w-4 mr-1" /> Oznacz rozwiązane
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRStatus(r.id, "dismissed")}
                  >
                    <X className="h-4 w-4 mr-1" /> Odrzuć zgłoszenie
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TaxRevenuePanel() {
  const fetchStats = useServerFn(getOwnerRevenueStats);
  const fetchParticipants = useServerFn(getDac7Participants);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-owner-revenue-stats"],
    queryFn: () => fetchStats({ data: undefined as any }),
  });
  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ["admin-dac7-participants"],
    queryFn: () => fetchParticipants({ data: undefined as any }),
  });
  const [expandedUser, setExpandedUser] = useState<string | null>(null);


  if (isLoading || !stats) {
    return <div className="mt-6 text-muted-foreground">Ładowanie...</div>;
  }

  const { threshold } = stats;
  const barColor =
    threshold.level === "exceeded"
      ? "bg-destructive"
      : threshold.level === "high"
        ? "bg-amber-600"
        : threshold.level === "warn"
          ? "bg-amber-500"
          : "bg-primary";

  return (
    <div className="mt-6 space-y-8">
      <div className="rounded-2xl border border-border/40 bg-gradient-surface p-5 space-y-3">
        <h2 className="font-semibold">
          Przychód z prowizji — {stats.quarter}. kwartał {stats.quarterYear}
        </h2>
        <div className="flex justify-between text-sm">
          <span>{stats.quarterRevenuePln.toFixed(2)} zł</span>
          <span className="text-muted-foreground">
            limit: {threshold.limitPln.toFixed(2)} zł ({threshold.pct}%)
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${Math.min(100, threshold.pct)}%` }}
          />
        </div>
        {threshold.level !== "ok" && (
          <p
            className={`text-sm ${threshold.level === "exceeded" ? "text-destructive" : "text-amber-600"}`}
          >
            {threshold.level === "exceeded"
              ? "Limit działalności nierejestrowanej został przekroczony w tym kwartale."
              : threshold.level === "high"
                ? "Zbliżasz się do limitu (ponad 90%)."
                : "Przekroczono 75% limitu w tym kwartale."}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Uwaga: przekroczenie kwoty 10 813,50 zł przychodu z prowizji w kwartale kalendarzowym
          oznacza konieczność zarejestrowania działalności gospodarczej (limit „działalności
          nierejestrowanej" na 2026 r.).
        </p>
      </div>

      <div className="rounded-2xl border border-border/40 bg-gradient-surface p-5">
        <h2 className="font-semibold mb-3">Przychód z prowizji — ostatnie 12 miesięcy</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/40">
                <th className="py-2 pr-4">Miesiąc</th>
                <th className="py-2">Przychód</th>
              </tr>
            </thead>
            <tbody>
              {stats.months.map((m) => (
                <tr key={m.month} className="border-b border-border/20 last:border-0">
                  <td className="py-1.5 pr-4">{m.month}</td>
                  <td className="py-1.5">{m.revenuePln.toFixed(2)} zł</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-gradient-surface p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold">
              Sprzedawcy i afilianci — DAC7 ({participants?.year ?? new Date().getFullYear()})
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Sprzedawcy: zakończone sprzedaże. Afilianci: wyłącznie faktycznie opłacone wypłaty.
              Środki w depozycie nie są liczone dla afiliantów. Próg: 30 wypłat lub 2 000 EUR.
            </p>
          </div>
          <Badge variant="secondary">{participants?.participants.length ?? 0} użytkowników</Badge>
        </div>
        {isLoadingParticipants ? (
          <p className="mt-5 text-sm text-muted-foreground">Ładowanie danych...</p>
        ) : participants?.participants.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Użytkownik</th>
                  <th className="py-2 pr-3">Sprzedaż sprzedawcy</th>
                  <th className="py-2 pr-3">Wypłaty afilianta</th>
                  <th className="py-2 pr-3">Suma informacyjna</th>
                  <th className="py-2 pr-3">Status DAC7</th>
                  <th className="py-2">Dane</th>
                </tr>
              </thead>
              <tbody>
                {participants.participants.map((row: any) => (
                  <Fragment key={row.userId}>
                  <tr className="border-b border-border/20">

                    <td className="py-3 pr-3">
                      <div className="font-medium">
                        {row.profile?.display_name ?? row.profile?.username ?? "Użytkownik"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{row.profile?.username ?? row.userId.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      {row.sellerCount} / {row.sellerAmount.toFixed(2)} zł
                      <span className="block text-[11px] text-muted-foreground">
                        {row.sellerDac7.level === "required"
                          ? "raportuj"
                          : row.sellerDac7.level === "warn"
                            ? "zbliża się"
                            : "poniżej"}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      {row.affiliateCount} / {row.affiliateAmount.toFixed(2)} zł
                      <span className="block text-[11px] text-muted-foreground">
                        {row.affiliateDac7.level === "required"
                          ? "raportuj"
                          : row.affiliateDac7.level === "warn"
                            ? "zbliża się"
                            : "poniżej"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-medium">
                      {row.totalCount} / {row.totalAmount.toFixed(2)} zł
                    </td>
                    <td
                      className={`py-3 pr-3 font-medium ${row.dac7.level === "required" ? "text-destructive" : row.dac7.level === "warn" ? "text-amber-500" : "text-emerald-500"}`}
                    >
                      {row.dac7.level === "required"
                        ? "WYMAGA RAPORTOWANIA"
                        : row.dac7.level === "warn"
                          ? "Zbliża się do progu"
                          : "Poniżej progu"}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        className="text-xs underline underline-offset-4"
                        onClick={() =>
                          setExpandedUser(expandedUser === row.userId ? null : row.userId)
                        }
                      >
                        {row.taxProfile?.tin ? "uzupełnione" : "brak danych"} —{" "}
                        {expandedUser === row.userId ? "ukryj" : "pokaż"}
                      </button>
                    </td>
                  </tr>
                  {expandedUser === row.userId && (
                    <tr className="border-b border-border/20 bg-muted/30">
                      <td colSpan={6} className="p-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                          <DetailBlock
                            title="Konto"
                            items={[
                              ["ID użytkownika", row.userId],
                              ["E-mail", row.email],
                              ["Nazwa użytkownika", row.profile?.username],
                              ["Nazwa wyświetlana", row.profile?.display_name],
                              [
                                "Zweryfikowany sprzedawca",
                                row.profile?.is_verified_seller ? "tak" : "nie",
                              ],
                              ["Zablokowany", row.profile?.is_banned ? "tak" : "nie"],
                            ]}
                          />
                          <DetailBlock
                            title="Dane podatkowe (DAC7)"
                            items={[
                              [
                                "Typ sprzedawcy",
                                row.taxProfile?.seller_kind === "business"
                                  ? "firma"
                                  : row.taxProfile?.seller_kind === "individual"
                                    ? "osoba prywatna"
                                    : row.taxProfile?.seller_kind,
                              ],
                              ["Imię i nazwisko / nazwa", row.taxProfile?.full_name],
                              ["Adres", row.taxProfile?.address_line],
                              [
                                "Miasto",
                                [row.taxProfile?.postal_code, row.taxProfile?.city]
                                  .filter(Boolean)
                                  .join(" "),
                              ],
                              ["Kraj", row.taxProfile?.country],
                              ["NIP / TIN", row.taxProfile?.tin],
                              ["Data urodzenia", row.taxProfile?.date_of_birth],
                              ["Miejsce urodzenia", row.taxProfile?.birth_place],
                              ["VAT ID", row.taxProfile?.vat_id],
                              ["Nr rejestrowy", row.taxProfile?.business_reg_no],
                              ["Zweryfikowane", row.taxProfile?.verified ? "tak" : "nie"],
                            ]}
                          />
                          <DetailBlock
                            title="Dane do wypłat"
                            items={[
                              ["Numer konta", row.payout?.payout_account],
                              ["Właściciel konta", row.payout?.payout_holder],
                              [
                                "Aktualizacja",
                                row.payout?.updated_at
                                  ? new Date(row.payout.updated_at).toLocaleDateString("pl-PL")
                                  : null,
                              ],
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}

              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">Brak wypłat w bieżącym roku.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border/40 bg-gradient-surface p-5">
        <h2 className="font-semibold">Przychód z prowizji — bieżący rok</h2>
        <p className="font-display text-3xl font-bold mt-1 text-gradient">
          {stats.yearRevenuePln.toFixed(2)} zł
        </p>
      </div>
    </div>
  );
}

function DetailBlock({
  title,
  items,
}: {
  title: string;
  items: [string, string | null | undefined][];
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/60 p-3">
      <p className="font-semibold mb-2">{title}</p>
      <dl className="space-y-1">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right break-all">{value ? String(value) : "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
