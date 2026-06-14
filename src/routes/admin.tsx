import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { ShieldCheck, Check, X, ExternalLink, FileText, Download, Flag, Ban, Trash2, UserCheck } from "lucide-react";
import { claimAdminIfNone, getAdminProductFileUrl, isCurrentUserAdmin, listAdminProducts, moderateProduct } from "@/lib/admin.functions";
import { listReports, updateReportStatus, takedownProduct, setUserBan } from "@/lib/reports.functions";


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
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const claim = useServerFn(claimAdminIfNone);
  const fetchAdminProducts = useServerFn(listAdminProducts);
  const updateProductStatus = useServerFn(moderateProduct);
  const getProductFileUrl = useServerFn(getAdminProductFileUrl);
  const [filter, setFilter] = useState<"pending_review" | "published" | "rejected" | "all">("pending_review");
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: adminCheck, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: () => checkAdmin(),
    enabled: !!user,
  });

  const isAdmin = adminCheck?.isAdmin ?? false;

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products", filter],
    enabled: isAdmin,
    queryFn: () => fetchAdminProducts({ data: { filter } }) as Promise<ProductRow[]>,
  });

  const moderate = async (id: string, newStatus: "published" | "rejected") => {
    try {
      await updateProductStatus({ data: { productId: id, status: newStatus, reviewNotes: notes[id] ?? null } });
      toast.success(newStatus === "published" ? "Zatwierdzono" : "Odrzucono");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się zmienić statusu produktu");
    }
  };

  const signFile = async (productId: string) => {
    try {
      const data = await getProductFileUrl({ data: { productId } });
      window.open(data.url, "_blank");
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

        {checkingAdmin ? (
          <div className="mt-10 text-muted-foreground">Sprawdzanie uprawnień...</div>
        ) : !isAdmin ? (
          <div className="mt-10 rounded-2xl border border-border/40 bg-gradient-surface p-8 text-center">
            <p className="text-lg font-semibold">Brak uprawnień administratora</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Jeżeli jesteś właścicielem platformy i żaden admin jeszcze nie istnieje, możesz przejąć rolę administratora poniżej (jednorazowo, dla pierwszego konta).
            </p>
            <Button
              className="mt-4 bg-gradient-primary text-primary-foreground shadow-glow"
              onClick={async () => {
                try {
                  const res = await claim();
                  if (res.claimed) {
                    toast.success("Zostałeś administratorem.");
                    qc.invalidateQueries({ queryKey: ["is-admin"] });
                  } else {
                    toast.error("Administrator już istnieje. Poproś go o nadanie roli.");
                  }
                } catch (e: any) {
                  toast.error(e?.message ?? "Błąd");
                }
              }}
            >
              Przejmij rolę admina (pierwsze konto)
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {(["pending_review", "published", "rejected", "all"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  {s === "pending_review" ? "Oczekujące" : s === "published" ? "Opublikowane" : s === "rejected" ? "Odrzucone" : "Wszystkie"}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {loadingProducts ? (
                <div className="text-muted-foreground">Ładowanie...</div>
              ) : !products || products.length === 0 ? (
                <div className="text-muted-foreground py-10 text-center">Brak produktów w tej kategorii.</div>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border/40 bg-gradient-surface p-5">
                    <div className="flex flex-col md:flex-row gap-5">
                      {p.preview_url ? (
                        <img src={p.preview_url} alt={p.title} className="w-full md:w-48 h-32 object-cover rounded-lg border border-border/40" />
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
                              {p.price.toFixed(2)} {p.currency} · {new Date(p.created_at).toLocaleString("pl-PL")}
                            </p>
                          </div>
                          <Badge variant={p.status === "published" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>
                            {p.status}
                          </Badge>
                        </div>
                        {p.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{p.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <Link to="/product/$id" params={{ id: p.id }} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/50">
                            <ExternalLink className="h-3 w-3" /> Podgląd strony
                          </Link>
                          {p.sample_url && (
                            <a href={p.sample_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/50">
                              <FileText className="h-3 w-3" /> Próbka
                            </a>
                          )}
                          {p.has_file && (
                            <button onClick={() => signFile(p.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-primary/50">
                              <Download className="h-3 w-3" /> Pobierz plik do weryfikacji
                            </button>
                          )}
                        </div>
                        {p.review_notes && (
                          <p className="text-xs mt-2 text-muted-foreground"><span className="font-semibold">Notatka:</span> {p.review_notes}</p>
                        )}
                        <div className="mt-4 space-y-2">
                          <Textarea
                            rows={2}
                            placeholder="Notatka dla sprzedawcy (opcjonalna)"
                            value={notes[p.id] ?? ""}
                            onChange={(e) => setNotes((s) => ({ ...s, [p.id]: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => moderate(p.id, "published")} className="bg-gradient-primary text-primary-foreground shadow-glow">
                              <Check className="h-4 w-4 mr-1" /> Zatwierdź
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => moderate(p.id, "rejected")}>
                              <X className="h-4 w-4 mr-1" /> Odrzuć
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
