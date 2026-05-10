import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Repeat2, ShoppingCart, ArrowLeft, Share2, Link2, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReportDialog } from "@/components/report-dialog";
import { VerifiedBadge } from "@/components/verified-badge";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: p, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(name), seller:profiles!products_seller_id_fkey(id,display_name,username,avatar_url,is_verified_seller)")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: myProducts } = useQuery({
    queryKey: ["myProducts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title")
        .eq("seller_id", user!.id)
        .eq("status", "published");
      return data ?? [];
    },
  });

  const [offeredId, setOfferedId] = useState<string>("");
  const [message, setMessage] = useState("");

  if (!p) return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Ładowanie produktu...</div>
      <SiteFooter />
    </div>
  );

  const isOwner = user?.id === p.seller_id;

  const buy = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (isOwner) return toast.error("To Twój produkt");
    const { error } = await supabase.from("transactions").insert({
      product_id: p.id,
      buyer_id: user.id,
      seller_id: p.seller_id,
      amount: p.price,
      currency: p.currency,
      status: "completed",
    });
    if (error) return toast.error(error.message);
    await supabase.rpc as any;
    await supabase.from("products").update({ downloads_count: (p.downloads_count ?? 0) + 1 }).eq("id", p.id);
    toast.success("Zakupiono! Sprawdź panel zakupów.");
    refetch();
  };

  const proposeExchange = async () => {
    if (!user || !offeredId) return;
    const { error } = await supabase.from("exchanges").insert({
      proposer_id: user.id,
      receiver_id: p.seller_id,
      offered_product_id: offeredId,
      requested_product_id: p.id,
      message,
    });
    if (error) return toast.error(error.message);
    toast.success("Propozycja wymiany wysłana!");
    setOfferedId(""); setMessage("");
  };

  const seller = p.seller as any;

  return (
    <TooltipProvider>
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8 flex-1">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Powrót do przeglądania
        </Link>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-gradient-surface border border-border/40 aspect-[4/3]">
              {p.preview_url ? (
                <img src={p.preview_url} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-primary opacity-30" />
              )}
            </div>
            {(p as any).sample_url && (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-accent font-medium">Próbka z zabezpieczeniem</span>
                  <span className="text-xs text-muted-foreground">Pełna wersja po zakupie</span>
                </div>
                <SamplePreview url={(p as any).sample_url} title={p.title} />
              </div>
            )}
          </div>

          <div>
            {p.category && <span className="text-xs uppercase tracking-wider text-accent">{(p.category as any).name}</span>}
            <h1 className="font-display text-4xl font-bold mt-2">{p.title}</h1>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <span>od {seller?.display_name ?? "Twórca"}</span>
              {seller?.is_verified_seller && <VerifiedBadge />}
              {!isOwner && user && (
                <ReportDialog targetType="product" targetId={p.id} />
              )}
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-5xl font-bold text-gradient">
                {Number(p.price) === 0 ? "Free" : `${Number(p.price).toFixed(2)}`}
              </span>
              {Number(p.price) > 0 && <span className="text-muted-foreground">{p.currency}</span>}
            </div>

            <p className="mt-6 text-foreground/80 whitespace-pre-wrap">{p.description}</p>

            {p.tags && p.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {p.tags.map((t: string) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full glass">#{t}</span>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {!isOwner && (
                <Button onClick={buy} size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow h-12">
                  <ShoppingCart className="h-4 w-4 mr-2" /> Kup teraz
                </Button>
              )}
              {!isOwner && p.is_tradable && user && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline" className="h-12">
                      <Repeat2 className="h-4 w-4 mr-2" /> Zaproponuj wymianę
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Wymiana 1:1</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={offeredId} onValueChange={setOfferedId}>
                        <SelectTrigger><SelectValue placeholder="Wybierz swój produkt" /></SelectTrigger>
                        <SelectContent>
                          {myProducts?.map((mp) => (
                            <SelectItem key={mp.id} value={mp.id}>{mp.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea placeholder="Wiadomość (opcjonalna)" value={message} onChange={(e) => setMessage(e.target.value)} />
                    </div>
                    <DialogFooter>
                      <Button onClick={proposeExchange} disabled={!offeredId} className="bg-gradient-primary text-primary-foreground">Wyślij propozycję</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground self-center">
                <Download className="h-4 w-4" /> {p.downloads_count} pobrań
              </span>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
    </TooltipProvider>
  );
}

function SamplePreview({ url, title }: { url: string; title: string }) {
  const lower = url.toLowerCase().split("?")[0];
  const isAudio = /\.(mp3|wav|ogg|m4a|aac|flac)$/.test(lower);
  const isVideo = /\.(mp4|webm|mov|m4v)$/.test(lower);
  const isImage = /\.(png|jpe?g|webp|gif|avif)$/.test(lower);
  const isPdf = /\.pdf$/.test(lower);

  if (isAudio) return <audio controls controlsList="nodownload" src={url} className="w-full" />;
  if (isVideo) return <video controls controlsList="nodownload" src={url} className="w-full rounded-lg max-h-80" />;
  if (isImage) return <img src={url} alt={`Próbka — ${title}`} className="w-full rounded-lg max-h-80 object-contain" />;
  if (isPdf) return <iframe src={url} title={`Próbka — ${title}`} className="w-full h-80 rounded-lg bg-background" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
      Otwórz próbkę w nowej karcie
    </a>
  );
}
