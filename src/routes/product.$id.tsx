import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Repeat2, ShoppingCart, ArrowLeft, Share2, Check, FileText, Lock, PlayCircle, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-browser";
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
import { getSecureStreamUrl } from "@/lib/secure-stream.functions";
import { purchaseProduct } from "@/lib/purchase.functions";
import { getProductDetails } from "@/lib/product.functions";
import { generateLicensePdf } from "@/lib/license-pdf";
import { generateLicenseText, LICENSE_TYPE_LABELS } from "@/lib/license";
import { LikeButton } from "@/components/like-button";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fetchProduct = useServerFn(getProductDetails);
  const purchaseFn = useServerFn(purchaseProduct);

  const { data: p, refetch, isLoading, error } = useQuery({
    queryKey: ["product", id, user?.id ?? "anon"],
    queryFn: () => fetchProduct({ data: { productId: id } }),
    retry: 1,
  });

  const { data: myTransaction, refetch: refetchTx } = useQuery({
    queryKey: ["myTx", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("product_id", id)
        .eq("buyer_id", user!.id)
        .eq("status", "completed")
        .limit(1)
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

  if (isLoading || (authLoading && !p)) return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Ładowanie produktu...</div>
      <SiteFooter />
    </div>
  );

  if (error || !p) return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-4xl font-bold mb-3">Produkt niedostępny</h1>
        <p className="text-muted-foreground mb-6">Ten produkt nie istnieje, został usunięty albo czeka jeszcze na weryfikację.</p>
        <Link to="/browse" className="inline-flex items-center gap-2 text-accent hover:underline">
          <ArrowLeft className="h-4 w-4" /> Wróć do przeglądania
        </Link>
      </main>
      <SiteFooter />
    </div>
  );

  const isOwner = user?.id === p.seller_id;
  const isPublished = p.status === "published";

  const buy = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (isOwner) return toast.error("To Twój produkt");
    try {
      const res = await purchaseFn({ data: { productId: p.id } });
      if (res.alreadyOwned) {
        toast.info("Już posiadasz ten produkt.");
      } else if (res.status === "completed") {
        toast.success("Zakupiono! Dostęp do treści odblokowany.");
      } else {
        toast.success("Zamówienie utworzone. Oczekuje na potwierdzenie płatności.");
      }
      refetch();
      refetchTx();
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się sfinalizować zakupu");
    }
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
              <span>od </span>
              {seller?.username ? (
                <Link to="/u/$username" params={{ username: seller.username }} className="text-foreground hover:text-primary font-medium">
                  {seller?.display_name ?? seller.username}
                </Link>
              ) : (
                <span>{seller?.display_name ?? "Twórca"}</span>
              )}
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

            {(p as any).license_terms && (
              <LicenseSummary terms={(p as any).license_terms} productTitle={p.title} sellerName={seller?.display_name ?? undefined} />
            )}

            {!isPublished && (
              <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
                Ten produkt czeka na weryfikację i nie można go jeszcze kupić.
              </div>
            )}

            {(myTransaction || isOwner) && (
              <SecureStreamPlayer
                productId={p.id}
                buyerEmail={user?.email ?? ""}
                isOwner={isOwner}
                deliveryMode={((p as any).license_terms?.delivery_mode ?? "both")}
                productTitle={p.title}
              />
            )}

            {myTransaction && (
              <Button
                variant="outline"
                className="mt-3 w-full sm:w-auto"
                onClick={() =>
                  generateLicensePdf({
                    transactionId: myTransaction.id,
                    createdAt: myTransaction.created_at,
                    productTitle: p.title,
                    productId: p.id,
                    amount: Number(myTransaction.amount),
                    currency: myTransaction.currency,
                    buyerName: user?.user_metadata?.display_name ?? user?.email ?? "Licencjobiorca",
                    buyerEmail: user?.email ?? "",
                    sellerName: seller?.display_name ?? "Sprzedawca",
                    terms: (p as any).license_terms ?? {},
                  })
                }
              >
                <FileText className="h-4 w-4 mr-2" /> Pobierz licencję PDF
              </Button>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <LikeButton productId={p.id} />
              <ShareButton title={p.title} />
              {!isOwner && isPublished && (
                <Button onClick={buy} size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow h-12">
                  <ShoppingCart className="h-4 w-4 mr-2" /> Kup teraz
                </Button>
              )}
              {!isOwner && isPublished && p.is_tradable && user && (
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

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title, url });
        return;
      }
    } catch {
      // fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link skopiowany! Wklej go na swoich social mediach.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nie udało się skopiować linku");
    }
  };

  return (
    <Button onClick={handleShare} size="lg" variant="outline" className="h-12">
      {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
      {copied ? "Skopiowano" : "Udostępnij / Skopiuj link"}
    </Button>
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

function LicenseSummary({ terms, productTitle, sellerName }: { terms: any; productTitle?: string; sellerName?: string }) {
  const t = terms ?? {};
  const typeKey = (t.license_type as keyof typeof LICENSE_TYPE_LABELS) ?? (t.exclusive ? "exclusive" : "personal");
  const typeLabel = LICENSE_TYPE_LABELS[typeKey] ?? "Personal";
  const text = generateLicenseText({ terms: t, productTitle, sellerName });
  return (
    <div className="mt-6 rounded-xl border border-border/40 bg-gradient-surface p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Licencja</span>
        </div>
        <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold">
          {typeLabel}
        </span>
      </div>
      <pre className="text-[12px] leading-relaxed whitespace-pre-wrap font-mono max-h-72 overflow-auto text-foreground/85">
        {text}
      </pre>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Pełna wersja licencji z Twoimi danymi zostanie dołączona do zamówienia jako PDF.
      </p>
    </div>
  );
}

function SecureStreamPlayer({ productId, buyerEmail, isOwner, deliveryMode = "both", productTitle }: { productId: string; buyerEmail: string; isOwner: boolean; deliveryMode?: "stream" | "download" | "both"; productTitle?: string }) {
  const fetchUrl = useServerFn(getSecureStreamUrl);
  const { data, isLoading, error } = useQuery({
    queryKey: ["stream-url", productId],
    queryFn: () => fetchUrl({ data: { productId } }),
    staleTime: 50 * 60 * 1000, // 50 min
  });

  if (isLoading) {
    return (
      <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-4 text-sm text-muted-foreground">
        <Lock className="h-4 w-4 inline mr-2" /> Przygotowuję bezpieczny dostęp...
      </div>
    );
  }
  if (error || !data?.url) {
    return (
      <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Nie udało się załadować zawartości.
      </div>
    );
  }

  const lower = data.url.toLowerCase().split("?")[0];
  const isAudio = /\.(mp3|wav|ogg|m4a|aac|flac)$/.test(lower);
  const isVideo = /\.(mp4|webm|mov|m4v)$/.test(lower);
  const watermark = isOwner ? "PODGLĄD WŁAŚCICIELA" : buyerEmail;
  const showStream = deliveryMode !== "download";
  const showDownload = deliveryMode !== "stream" || isOwner;

  const headerLabel =
    deliveryMode === "download"
      ? "Twój dostęp (plik do pobrania)"
      : deliveryMode === "stream"
      ? "Twój dostęp (tylko streaming)"
      : "Twój dostęp (streaming + pobieranie)";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = data.url;
    a.download = productTitle ?? "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-success">
          <PlayCircle className="h-4 w-4" /> {headerLabel}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Link wygasa za ~1h</span>
      </div>

      {showStream && (isVideo ? (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            src={data.url}
            className="w-full max-h-[420px]"
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 select-none">
            <div className="flex justify-end">
              <span className="text-[11px] font-mono text-white/70 bg-black/40 px-2 py-1 rounded">
                {watermark}
              </span>
            </div>
            <div className="flex justify-start">
              <span className="text-[11px] font-mono text-white/70 bg-black/40 px-2 py-1 rounded">
                {watermark}
              </span>
            </div>
          </div>
        </div>
      ) : isAudio ? (
        <div>
          <audio
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            src={data.url}
            className="w-full"
          />
          <p className="mt-2 text-[11px] font-mono text-muted-foreground">Licencja przypisana do: {watermark}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ten typ pliku nie jest streamowalny — użyj przycisku pobierania poniżej.
        </p>
      ))}

      {showDownload && (
        <div className={showStream ? "mt-3" : ""}>
          <Button onClick={handleDownload} className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Download className="h-4 w-4 mr-2" /> Pobierz plik
          </Button>
          {deliveryMode === "stream" && isOwner && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Pobieranie widoczne tylko dla Ciebie (właściciela). Kupujący otrzymują wyłącznie streaming.
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Treść chroniona prawem autorskim. Nagrywanie, kopiowanie i redystrybucja są zabronione i mogą być podstawą roszczeń.
      </p>
    </div>
  );
}

