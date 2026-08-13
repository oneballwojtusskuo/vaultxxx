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
import { useEffect, useState } from "react";
import { setReferralCookie, getReferralCookie, buildReferralLink, clearReferralCookie } from "@/lib/affiliate";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ReportDialog } from "@/components/report-dialog";
import { VerifiedBadge } from "@/components/verified-badge";
import { getSecureStreamUrl } from "@/lib/secure-stream.functions";
import { purchaseProduct } from "@/lib/purchase.functions";
import { getProductDetails } from "@/lib/product.functions";
import { generateLicensePdf } from "@/lib/license-pdf";
import { generateLicenseText, LICENSE_TYPE_LABELS } from "@/lib/license";
import { LikeButton } from "@/components/like-button";
import { ProductReviews, RatingSummary } from "@/components/reviews";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { getStripeEnvironment } from "@/lib/stripe";
import { buyerPriceOf } from "@/lib/pricing";
import { EscrowActions } from "@/components/escrow-actions";
import { BackLink } from "@/components/back-link";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fetchProduct = useServerFn(getProductDetails);
  const purchaseFn = useServerFn(purchaseProduct);

  // Capture ?ref=<userId> into a per-product cookie (30 days), then clean URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && user?.id !== ref) {
      setReferralCookie(id, ref);
      params.delete("ref");
      const clean = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


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
        .in("status", ["held", "released", "completed", "disputed"])
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

  const [offeredIds, setOfferedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptWithdrawal, setAcceptWithdrawal] = useState(false);


  // Handle Stripe return_url: ?checkout=success
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("Płatność zaksięgowana! Odblokowuję dostęp…");
      params.delete("checkout");
      params.delete("session_id");
      const clean = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", clean);
      // Poll a few times — webhook is usually near-instant, but async methods (BLIK) can lag.
      let attempts = 0;
      const iv = setInterval(async () => {
        attempts++;
        const r = await refetchTx();
        if (r.data || attempts >= 8) clearInterval(iv);
      }, 1500);
      return () => clearInterval(iv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Visitor came from an affiliate link, clicked "Kup teraz", signed in and came back:
  // land them straight on the purchase panel instead of losing the referral.
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("buy") !== "1") return;
    params.delete("buy");
    const clean = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", clean);
    setTimeout(() => {
      document.getElementById("panel-zakupu")?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.info("Potwierdź obie zgody i dokończ zakup.");
    }, 400);
  }, [user]);


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
    if (!user) {
      navigate({ to: "/auth", search: { next: `${window.location.pathname}?buy=1` } });
      return;
    }
    if (isOwner) return toast.error("To Twój produkt");
    if (!acceptTerms || !acceptWithdrawal) {
      return toast.error("Zaznacz oba wymagane zgody przed dokonaniem zakupu.");
    }

    try {
      const referralUserId = getReferralCookie(p.id);
      const res = await purchaseFn({
        data: {
          productId: p.id,
          referralUserId: referralUserId && referralUserId !== user.id ? referralUserId : null,
          returnUrl: typeof window !== "undefined" ? window.location.origin + window.location.pathname : undefined,
          environment: (() => { try { return getStripeEnvironment(); } catch { return "sandbox" as const; } })(),
        },
      });
      if (res.alreadyOwned) {
        toast.info("Już posiadasz ten produkt.");
        refetchTx();
      } else if (res.status === "released") {
        toast.success("Zakupiono! Dostęp do treści odblokowany.");
        clearReferralCookie(p.id);
        refetch();
        refetchTx();
      } else if ("clientSecret" in res && res.clientSecret) {
        setCheckoutSecret(res.clientSecret);
        setCheckoutOpen(true);
      } else {
        toast.success("Zamówienie utworzone. Oczekuje na potwierdzenie płatności.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się sfinalizować zakupu");
    }
  };



  const proposeExchange = async () => {
    if (!user || offeredIds.length === 0) return;
    const { data: ex, error } = await supabase
      .from("exchanges")
      .insert({
        proposer_id: user.id,
        receiver_id: p.seller_id,
        offered_product_id: offeredIds[0],
        requested_product_id: p.id,
        message,
      })
      .select("id")
      .maybeSingle();
    if (error || !ex) return toast.error(error?.message ?? "Nie udało się wysłać propozycji");

    const items = [
      ...offeredIds.map((id) => ({ exchange_id: ex.id, product_id: id, side: "offered" })),
      { exchange_id: ex.id, product_id: p.id, side: "requested" },
    ];
    const { error: iErr } = await (supabase as any).from("exchange_items").insert(items);
    if (iErr) return toast.error(iErr.message);

    toast.success("Propozycja wymiany wysłana!");
    setOfferedIds([]); setMessage("");
  };


  const seller = p.seller as any;

  return (
    <TooltipProvider>
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8 flex-1">
        <BackLink />

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-gradient-surface border border-border/40 aspect-[4/3]">
              {p.preview_url ? (
                <img src={p.preview_url} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-primary opacity-30" />
              )}
            </div>
            {(p as any).sample_url && !myTransaction && !isOwner && (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-accent font-medium">Próbka z zabezpieczeniem</span>
                  <span className="text-xs text-muted-foreground">Pełna wersja po zakupie</span>
                </div>
                <SamplePreview url={(p as any).sample_url} title={p.title} />
              </div>
            )}
            {(myTransaction || isOwner) && (
              <div className="rounded-2xl border border-success/30 bg-success/5 p-4 text-sm text-success inline-flex items-center gap-2">
                <Check className="h-4 w-4" />
                {isOwner ? "To Twój produkt — widzisz pełną wersję poniżej." : "Masz już dostęp do tego produktu — próbka ukryta."}
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
                  {seller?.username ?? seller.display_name}
                </Link>
              ) : (
                <span>{seller?.username ?? "Twórca"}</span>
              )}
              {seller?.is_verified_seller && <VerifiedBadge />}
              {!isOwner && user && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => navigate({ to: "/messages/$userId", params: { userId: p.seller_id } })}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1" /> Napisz
                </Button>
              )}
              {!isOwner && user && (
                <ReportDialog targetType="product" targetId={p.id} />
              )}
            </div>
            <div className="mt-2">
              <RatingSummary sellerId={p.seller_id} />
            </div>


            {!myTransaction && !isOwner && (
              <>
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-gradient">
                    {Number(p.price) === 0 ? "Free" : `${buyerPriceOf(p.price).toFixed(2)}`}
                  </span>
                  {Number(p.price) > 0 && <span className="text-muted-foreground">{p.currency}</span>}
                </div>
                {Number(p.price) > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sprzedawca otrzyma {Number(p.price).toFixed(2)} {p.currency} · doliczone 10% prowizji platformy
                  </p>
                )}
                <DeliveryModeCallout mode={((p as any).license_terms?.delivery_mode ?? "both")} />
              </>
            )}

            <p className="mt-6 text-foreground/80 whitespace-pre-wrap">{p.description}</p>

            {p.tags && p.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {p.tags.map((t: string) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full glass">#{t}</span>
                ))}
              </div>
            )}

            {(p as any).license_terms && (
              <LicenseSummary terms={(p as any).license_terms} productTitle={p.title} sellerName={seller?.username ?? undefined} />
            )}

            {!isPublished && (
              <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
                {p.status === "archived"
                  ? myTransaction
                    ? "Sprzedawca zdjął to ogłoszenie z portalu. Twój dostęp do zakupionego pliku i licencji pozostaje bez zmian."
                    : "To ogłoszenie zostało zdjęte przez sprzedawcę i nie jest już dostępne do zakupu."
                  : "Ten produkt czeka na weryfikację i nie można go jeszcze kupić."}
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
              <>
                <EscrowActions
                  transactionId={myTransaction.id}
                  status={myTransaction.status as string}
                  onChanged={() => refetchTx()}
                />
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
                      sellerName: seller?.username ?? "Sprzedawca",
                      terms: (p as any).license_terms ?? {},
                    })
                  }
                >
                  <FileText className="h-4 w-4 mr-2" /> Pobierz licencję PDF
                </Button>
              </>
            )}

            {!isOwner && isPublished && !myTransaction && (
              <PurchaseConsents
                acceptTerms={acceptTerms}
                setAcceptTerms={setAcceptTerms}
                acceptWithdrawal={acceptWithdrawal}
                setAcceptWithdrawal={setAcceptWithdrawal}
              />
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <LikeButton productId={p.id} sellerId={p.seller_id} />
              <ShareButton title={p.title} />
              {user && !isOwner && isPublished && (p as any).affiliate_commission_pct > 0 && (
                <ReferralButton productId={p.id} referrerId={user.id} pct={(p as any).affiliate_commission_pct} />
              )}
              {!isOwner && isPublished && !myTransaction && (
                <Button
                  onClick={buy}
                  size="lg"
                  disabled={!acceptTerms || !acceptWithdrawal}
                  className="bg-gradient-primary text-primary-foreground shadow-glow h-12 disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" /> Kupuję i płacę
                </Button>
              )}

              {!isOwner && isPublished && p.is_tradable && user && !myTransaction && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline" className="h-12">
                      <Repeat2 className="h-4 w-4 mr-2" /> Zaproponuj wymianę
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Zaproponuj wymianę</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Zaznacz jeden lub więcej swoich produktów, które chcesz zaoferować w zamian.
                      </p>
                      <div className="max-h-64 overflow-auto rounded-lg border border-border/40 divide-y divide-border/40">
                        {(myProducts ?? []).length === 0 && (
                          <p className="p-3 text-sm text-muted-foreground">Nie masz jeszcze produktów do wymiany.</p>
                        )}
                        {myProducts?.map((mp) => {
                          const checked = offeredIds.includes(mp.id);
                          return (
                            <label key={mp.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-primary"
                                checked={checked}
                                onChange={() =>
                                  setOfferedIds((prev) =>
                                    checked ? prev.filter((x) => x !== mp.id) : [...prev, mp.id],
                                  )
                                }
                              />
                              <span className="text-sm line-clamp-1">{mp.title}</span>
                            </label>
                          );
                        })}
                      </div>
                      <Textarea placeholder="Wiadomość (opcjonalna) — możesz tu negocjować warunki" value={message} onChange={(e) => setMessage(e.target.value)} />
                    </div>
                    <DialogFooter>
                      <Button onClick={proposeExchange} disabled={offeredIds.length === 0} className="bg-gradient-primary text-primary-foreground">
                        Wyślij propozycję{offeredIds.length > 1 ? ` (${offeredIds.length} produkty)` : ""}
                      </Button>
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

        <ProductReviews
          productId={p.id}
          sellerId={p.seller_id}
          transactionId={myTransaction?.id ?? null}
        />
      </main>
      <SiteFooter />
      <CheckoutDialog clientSecret={checkoutSecret} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
    </TooltipProvider>
  );
}

function ReferralButton({ productId, referrerId, pct }: { productId: string; referrerId: string; pct: number }) {
  const [copied, setCopied] = useState(false);
  const link = buildReferralLink(productId, referrerId);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(`Link polecający skopiowany! Za każdy zakup z tego linku dostaniesz ${pct}% prowizji.`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Nie udało się skopiować linku");
    }
  };
  return (
    <Button onClick={handle} size="lg" variant="outline" className="h-12 border-accent/50 text-accent hover:bg-accent/10">
      {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
      {copied ? "Link partnera skopiowany" : `Generuj link polecający (${pct}%)`}
    </Button>
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
  const { data, isLoading, error, refetch } = useQuery({
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

  const handleDownload = async () => {
    const latest = await refetch();
    const access = latest.data ?? data;
    const href = (access as any)?.downloadUrl || access?.url;
    const name = (access as any)?.downloadName || productTitle || "plik";
    if (!href || typeof href !== "string") {
      toast.error("Nie udało się przygotować pliku do pobrania. Odśwież stronę i spróbuj ponownie.");
      return;
    }
    try {
      const url = new URL(href, window.location.origin);
      if (url.pathname.startsWith("/_serverFn")) {
        throw new Error("Invalid download endpoint");
      }
      const a = document.createElement("a");
      a.href = url.toString();
      a.download = name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      toast.error("Nie udało się przygotować linku do pliku. Spróbuj ponownie za chwilę.");
    }
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
          Ten typ pliku nie jest odtwarzany w przeglądarce — użyj przycisku pobierania poniżej.
        </p>
      ))}

      {showDownload && (
        <div className={showStream ? "mt-3" : ""}>
          <Button onClick={handleDownload} className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Download className="h-4 w-4 mr-2" /> Pobierz plik
          </Button>
          {deliveryMode === "stream" && (isVideo || isAudio) && isOwner && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Pobieranie widoczne tylko dla Ciebie (właściciela). Kupujący otrzymują wyłącznie streaming.
            </p>
          )}
        </div>
      )}

      {deliveryMode === "stream" && !isVideo && !isAudio && !isOwner && (
        <p className="mt-3 text-[11px] text-destructive">
          Sprzedawca oznaczył ten produkt jako „tylko streaming", ale format pliku nie umożliwia odtwarzania w przeglądarce. Skontaktuj się ze sprzedawcą lub zespołem vlnd.
        </p>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Treść chroniona prawem autorskim. Nagrywanie, kopiowanie i redystrybucja są zabronione i mogą być podstawą roszczeń.
      </p>
    </div>
  );
}

function DeliveryModeCallout({ mode }: { mode: "stream" | "download" | "both" }) {
  const cfg =
    mode === "stream"
      ? {
          icon: <PlayCircle className="h-5 w-5" />,
          title: "Tylko streaming w przeglądarce",
          desc: "Po zakupie odtworzysz plik bezpośrednio na tej stronie. Sprzedawca nie udostępnia pobierania — nie zapiszesz kopii na dysku.",
          cls: "border-accent/40 bg-accent/10 text-accent",
        }
      : mode === "download"
      ? {
          icon: <Download className="h-5 w-5" />,
          title: "Plik do pobrania",
          desc: "Po zakupie otrzymasz przycisk pobierania — plik zapiszesz lokalnie na swoim urządzeniu.",
          cls: "border-primary/40 bg-primary/10 text-primary",
        }
      : {
          icon: <PlayCircle className="h-5 w-5" />,
          title: "Streaming + pobieranie",
          desc: "Po zakupie możesz zarówno odtworzyć plik w przeglądarce, jak i pobrać go na dysk.",
          cls: "border-success/40 bg-success/10 text-success",
        };
  return (
    <div className={`mt-4 rounded-xl border p-4 flex gap-3 ${cfg.cls}`}>
      <div className="shrink-0 mt-0.5">{cfg.icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">Sposób dostawy: {cfg.title}</div>
        <p className="mt-1 text-xs text-foreground/80">{cfg.desc}</p>
      </div>
    </div>
  );
}

function PurchaseConsents({
  acceptTerms,
  setAcceptTerms,
  acceptWithdrawal,
  setAcceptWithdrawal,
}: {
  acceptTerms: boolean;
  setAcceptTerms: (v: boolean) => void;
  acceptWithdrawal: boolean;
  setAcceptWithdrawal: (v: boolean) => void;
}) {
  return (
    <div className="mt-8 rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={acceptTerms}
          onCheckedChange={(v) => setAcceptTerms(v === true)}
          className="mt-0.5"
          aria-label="Akceptuję Regulamin i Politykę Prywatności"
        />
        <span className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
          Akceptuję{" "}
          <Link to="/regulamin" target="_blank" className="text-accent underline hover:text-accent/80">
            Regulamin Serwisu
          </Link>{" "}
          oraz Politykę Prywatności.
        </span>
      </label>
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={acceptWithdrawal}
          onCheckedChange={(v) => setAcceptWithdrawal(v === true)}
          className="mt-0.5"
          aria-label="Zgoda na dostarczenie treści cyfrowych przed upływem terminu odstąpienia"
        />
        <span className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
          Wyrażam zgodę na dostarczenie treści cyfrowych przed upływem terminu do odstąpienia od
          umowy i przyjmuję do wiadomości, że{" "}
          <b className="text-foreground">
            stracę prawo do odstąpienia od umowy z chwilą rozpoczęcia pobierania pliku
          </b>{" "}
          (art. 38 pkt 13 ustawy o prawach konsumenta).
        </span>
      </label>
    </div>
  );
}


