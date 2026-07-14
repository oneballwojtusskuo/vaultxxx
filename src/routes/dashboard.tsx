import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, PlayCircle, Trash2, FileText, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { generateLicensePdf } from "@/lib/license-pdf";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: myProducts, refetch: refetchProducts } = useQuery({
    queryKey: ["my-products", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("products").select("*, category:categories(name)").eq("seller_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: purchases } = useQuery({
    queryKey: ["purchases", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("transactions").select("*, product:products(id,title,preview_url,file_path,license_terms,seller:profiles!products_seller_id_fkey(display_name))").eq("buyer_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: sales } = useQuery({
    queryKey: ["sales", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("transactions").select("*, product:products(title)").eq("seller_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await (supabase as any).from("seller_notifications").select("*").eq("user_id", user!.id).is("read_at", null).order("created_at", { ascending: false })).data ?? [],
  });

  const dismissNotification = async (id: string) => {
    const { error } = await (supabase as any).from("seller_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    refetchNotifications();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Usunąć produkt?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
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
      sellerName: t.product.seller?.display_name ?? "Sprzedawca",
      terms: t.product.license_terms ?? {},
    });
    toast.success("Licencja wygenerowana");
  };

  if (loading || !user) return null;

  const totalRevenue = sales?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">Mój panel</h1>
            <p className="text-muted-foreground mt-1">Zarządzaj produktami, zakupami i wymianami.</p>
          </div>
          <Link to="/sell"><Button className="bg-gradient-primary text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1"/> Nowy produkt</Button></Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Stat label="Moje produkty" value={myProducts?.length ?? 0} />
          <Stat label="Zakupy" value={purchases?.length ?? 0} />
          <Stat label="Przychód" value={`${totalRevenue.toFixed(2)} PLN`} />
        </div>

        {notifications && notifications.length > 0 && (
          <div className="mt-8 space-y-3">
            {notifications.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">
                    Twoje ogłoszenie {n.product_title ? <>„{n.product_title}"</> : null} zostało usunięte przez administratora.
                  </p>
                  {n.admin_note && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      <span className="font-medium text-foreground">Powód:</span> {n.admin_note}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pl-PL")}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => dismissNotification(n.id)} aria-label="Odrzuć">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}


        <Tabs defaultValue="products" className="mt-10">
          <TabsList>
            <TabsTrigger value="products">Moje produkty</TabsTrigger>
            <TabsTrigger value="purchases">Zakupy</TabsTrigger>
            <TabsTrigger value="sales">Sprzedaż</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6 space-y-3">
            {myProducts?.length === 0 && <Empty msg="Nie masz jeszcze produktów" />}
            {myProducts?.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl bg-gradient-surface border border-border/40 p-4">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  {p.preview_url ? <img src={p.preview_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gradient-primary opacity-40"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to="/product/$id" params={{ id: p.id }} className="font-semibold hover:text-primary line-clamp-1">{p.title}</Link>
                  <p className="text-sm text-muted-foreground">{Number(p.price).toFixed(2)} {p.currency} · {p.downloads_count} pobrań</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="purchases" className="mt-6 space-y-3">
            {purchases?.length === 0 && <Empty msg="Brak zakupów" />}
            {purchases?.map((t: any) => (
              <div key={t.id} className="flex items-center gap-4 rounded-xl bg-gradient-surface border border-border/40 p-4">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  {t.product?.preview_url ? <img src={t.product.preview_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gradient-primary opacity-40"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-1">{t.product?.title}</p>
                  <p className="text-sm text-muted-foreground">{Number(t.amount).toFixed(2)} {t.currency}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Link to="/product/$id" params={{ id: t.product?.id ?? "" }}>
                    <Button size="sm" variant="outline">
                      <PlayCircle className="h-4 w-4 mr-1"/> Odtwórz
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => downloadLicense(t)}>
                    <FileText className="h-4 w-4 mr-1"/> Licencja PDF
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="sales" className="mt-6 space-y-3">
            {sales?.length === 0 && <Empty msg="Brak sprzedaży" />}
            {sales?.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-gradient-surface border border-border/40 p-4">
                <div>
                  <p className="font-semibold">{t.product?.title}</p>
                  <p className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleString("pl-PL")}</p>
                </div>
                <span className="font-bold text-gradient">+{Number(t.amount).toFixed(2)} {t.currency}</span>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
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
  return <div className="text-center text-muted-foreground py-12 rounded-xl border border-dashed border-border/50">{msg}</div>;
}
