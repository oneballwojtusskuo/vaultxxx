import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Repeat2, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exchanges")({
  component: Exchanges,
});

function Exchanges() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const incomingQ = useQuery({
    queryKey: ["exchanges-in", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase
      .from("exchanges")
      .select("*, offered:products!exchanges_offered_product_id_fkey(id,title,preview_url), requested:products!exchanges_requested_product_id_fkey(id,title,preview_url)")
      .eq("receiver_id", user!.id)
      .order("created_at", { ascending: false })).data ?? [],
  });
  const outgoingQ = useQuery({
    queryKey: ["exchanges-out", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase
      .from("exchanges")
      .select("*, offered:products!exchanges_offered_product_id_fkey(id,title,preview_url), requested:products!exchanges_requested_product_id_fkey(id,title,preview_url)")
      .eq("proposer_id", user!.id)
      .order("created_at", { ascending: false })).data ?? [],
  });

  const updateStatus = async (id: string, status: "accepted" | "rejected" | "cancelled") => {
    const { error } = await supabase.from("exchanges").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Zaktualizowano");
    incomingQ.refetch(); outgoingQ.refetch();
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1">
        <h1 className="font-display text-4xl font-bold flex items-center gap-3">
          <Repeat2 className="h-8 w-8 text-accent" /> Wymiany
        </h1>
        <p className="text-muted-foreground mt-1">Zarządzaj propozycjami wymian z innymi twórcami.</p>

        <Tabs defaultValue="incoming" className="mt-8">
          <TabsList>
            <TabsTrigger value="incoming">Przychodzące ({incomingQ.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="outgoing">Wysłane ({outgoingQ.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-6 space-y-3">
            {incomingQ.data?.length === 0 && <Empty msg="Brak propozycji" />}
            {incomingQ.data?.map((ex: any) => (
              <ExchangeRow key={ex.id} ex={ex} kind="incoming" onAction={updateStatus} />
            ))}
          </TabsContent>
          <TabsContent value="outgoing" className="mt-6 space-y-3">
            {outgoingQ.data?.length === 0 && <Empty msg="Brak wysłanych" />}
            {outgoingQ.data?.map((ex: any) => (
              <ExchangeRow key={ex.id} ex={ex} kind="outgoing" onAction={updateStatus} />
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function ExchangeRow({ ex, kind, onAction }: { ex: any; kind: "incoming" | "outgoing"; onAction: (id: string, s: any) => void }) {
  const statusColor: Record<string, string> = {
    pending: "text-accent",
    accepted: "text-success",
    rejected: "text-destructive",
    cancelled: "text-muted-foreground",
  };
  return (
    <div className="rounded-xl bg-gradient-surface border border-border/40 p-4">
      <div className="flex items-center gap-4">
        <Mini p={ex.offered} label={kind === "incoming" ? "Oferują" : "Twoja oferta"} />
        <Repeat2 className="h-5 w-5 text-accent shrink-0" />
        <Mini p={ex.requested} label={kind === "incoming" ? "Za Twoje" : "Chcesz"} />
        <div className="ml-auto text-right">
          <p className={`text-sm font-medium uppercase ${statusColor[ex.status]}`}>{ex.status}</p>
          {ex.status === "pending" && (
            <div className="flex gap-2 mt-2">
              {kind === "incoming" ? (
                <>
                  <Button size="sm" onClick={() => onAction(ex.id, "accepted")} className="bg-success text-success-foreground"><Check className="h-3 w-3 mr-1"/>Akceptuj</Button>
                  <Button size="sm" variant="outline" onClick={() => onAction(ex.id, "rejected")}><X className="h-3 w-3 mr-1"/>Odrzuć</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onAction(ex.id, "cancelled")}>Anuluj</Button>
              )}
            </div>
          )}
        </div>
      </div>
      {ex.message && <p className="mt-3 text-sm text-muted-foreground italic">"{ex.message}"</p>}
    </div>
  );
}

function Mini({ p, label }: { p: any; label: string }) {
  return (
    <Link to="/product/$id" params={{ id: p?.id ?? "" }} className="flex items-center gap-2 min-w-0">
      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
        {p?.preview_url ? <img src={p.preview_url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gradient-primary opacity-40"/>}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium line-clamp-1">{p?.title}</p>
      </div>
    </Link>
  );
}
function Empty({ msg }: { msg: string }) {
  return <div className="text-center text-muted-foreground py-12 rounded-xl border border-dashed border-border/50">{msg}</div>;
}
