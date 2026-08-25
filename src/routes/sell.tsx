import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { validateCleanText } from "@/lib/profanity";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { Upload, ShieldCheck, FileText, Droplets, Loader2, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useServerFn } from "@tanstack/react-start";
import { validateUploadedFile } from "@/lib/upload-validate.functions";
import { reviewListing } from "@/lib/moderation.functions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buyerPriceOf } from "@/lib/pricing";
import {
  LICENSE_TYPE_LABELS,
  LICENSE_DURATION_LABELS,
  LICENSE_OPTION_HELP,
  DELIVERY_MODE_LABELS,
  TERRITORY_PRESET_LABELS,
  presetForType,
  generateLicenseText,
  type LicenseType,
  type LicenseLimit,
  type LicenseDuration,
  type LicenseTerms,
  type DeliveryMode,
  type TerritoryPreset,
} from "@/lib/license";

const SAFE_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const SAFE_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const FORBIDDEN_EXT = [".svg", ".html", ".htm", ".xhtml", ".xml", ".js", ".mjs"];

function checkImageFile(file: File) {
  const name = file.name.toLowerCase();
  if (FORBIDDEN_EXT.some((e) => name.endsWith(e))) return "File type not allowed";
  if (!SAFE_IMAGE_EXT.some((e) => name.endsWith(e))) return "Use JPG, PNG, WebP or GIF";
  if (file.type && !SAFE_IMAGE_MIME.includes(file.type)) return "File type not allowed";
  if (file.size > 10 * 1024 * 1024) return "Image too large (max 10 MB)";
  return null;
}

function checkProductFile(file: File) {
  const name = file.name.toLowerCase();
  if (FORBIDDEN_EXT.some((e) => name.endsWith(e))) return "File type not allowed";
  if (file.size > 500 * 1024 * 1024) return "File too large (max 500 MB)";
  return null;
}

// Formaty, które można odtworzyć bezpośrednio w przeglądarce (streaming).
const STREAMABLE_EXT = [
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".flac",
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
];
const DOWNLOAD_ONLY_HINT = ".zip, .rar, .psd, .ai, .pdf, .fbx, .blend, .wav bez odtwarzacza, itp.";
export function isStreamableFile(file: File | null | undefined): boolean {
  if (!file) return false;
  const n = file.name.toLowerCase();
  return STREAMABLE_EXT.some((e) => n.endsWith(e));
}

async function generateWatermarkedImage(source: File, watermarkText: string): Promise<File> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Nie udało się odczytać obrazu"));
    reader.readAsDataURL(source);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Niepoprawny obraz okładki"));
    i.src = dataUrl;
  });
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nieobsługiwany");
  ctx.drawImage(img, 0, 0, w, h);

  // Dimming overlay for contrast
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, w, h);

  const text = (watermarkText || "PREVIEW").toUpperCase();
  const diag = Math.sqrt(w * w + h * h);
  const fontSize = Math.max(28, Math.floor(diag / Math.max(6, text.length * 0.9)));
  ctx.font = `900 ${fontSize}px "Space Grotesk", Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Big diagonal main watermark
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.atan2(h, w));
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = Math.max(2, fontSize / 22);
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();

  // Tiled subtle repetition so it's harder to crop out
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffffff";
  const smallFont = Math.max(16, Math.floor(fontSize / 3.2));
  ctx.font = `700 ${smallFont}px "Space Grotesk", Inter, system-ui, sans-serif`;
  const stepX = smallFont * (text.length * 0.7 + 4);
  const stepY = smallFont * 5;
  for (let y = -h; y < h * 2; y += stepY) {
    for (let x = -w; x < w * 2; x += stepX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Nie udało się wygenerować pliku"))),
      "image/jpeg",
      0.85,
    ),
  );
  const base = source.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}-watermark.jpg`, { type: "image/jpeg" });
}

/** Info icon that shows help both on hover (desktop, Tooltip) and on click/tap (mobile, Popover). */
function HelpIcon({ help, className }: { help?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  if (!help) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setOpen((o) => !o);
              }}
              className="inline-flex shrink-0"
              aria-label="Więcej informacji"
            >
              <Info
                className={className ?? "h-3.5 w-3.5 text-muted-foreground hover:text-primary"}
              />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {help}
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="top" className="max-w-xs text-xs leading-relaxed w-auto">
        {help}
      </PopoverContent>
    </Popover>
  );
}

function HelpLabel({ text, help }: { text: string; help?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-xs">{text}</Label>
      <HelpIcon help={help} />
    </div>
  );
}

/** Inline, non-blocking contradiction warnings shown near license option fields. */
function contradictionWarning(
  key: string,
  terms: LicenseTerms,
  licType: LicenseType,
): string | undefined {
  if (key === "create_nft" && terms.create_nft && !terms.redistribution) {
    return "Zezwalasz na tworzenie NFT, ale zabraniasz redystrybucji — mintowanie NFT zwykle wymaga też możliwości rozpowszechniania pliku.";
  }
  if (key === "resale" && terms.resale && !terms.redistribution) {
    return "Zezwalasz na odsprzedaż, ale zabraniasz redystrybucji — bez redystrybucji odsprzedany plik trudno legalnie przekazać dalej.";
  }
  if (key === "train_ai" && terms.train_ai && !terms.commercial_use) {
    return "Zgoda na trenowanie AI zwykle idzie w parze z użytkiem komercyjnym — sprawdź, czy na pewno chcesz to rozdzielić.";
  }
  if (
    key === "attribution_required" &&
    terms.attribution_required === false &&
    licType === "personal"
  ) {
    return 'Licencja "Personal" zwykle wymaga podania autora — rozważ włączenie tej opcji.';
  }
  return undefined;
}

/** Diff against the last applied preset — used for a subtle "deviates from standard" note. */
function deviatesFromPreset(
  key: keyof LicenseTerms,
  terms: LicenseTerms,
  preset: LicenseTerms | null,
): boolean {
  if (!preset) return false;
  return JSON.stringify(terms[key] ?? null) !== JSON.stringify(preset[key] ?? null);
}

function DeviationNote({ show, licType }: { show: boolean; licType: LicenseType }) {
  if (!show) return null;
  return (
    <p className="text-[11px] text-amber-500">
      Ta zmiana odbiega od standardowej licencji {LICENSE_TYPE_LABELS[licType]} — upewnij się, że to
      zamierzone.
    </p>
  );
}

export const Route = createFileRoute("/sell")({
  component: Sell,
});

function Sell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [categoryId, setCategoryId] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");

  const [tags, setTags] = useState("");
  const [tradable, setTradable] = useState(true);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [generatingWatermark, setGeneratingWatermark] = useState(false);
  const [licType, setLicType] = useState<LicenseType>("personal");
  const [licTerms, setLicTerms] = useState<LicenseTerms>(() => presetForType("personal"));
  const [presetSnapshot, setPresetSnapshot] = useState<LicenseTerms | null>(() =>
    presetForType("personal"),
  );
  const [licCustom, setLicCustom] = useState("");
  const [licMaxStreams, setLicMaxStreams] = useState("");

  const [affiliatePct, setAffiliatePct] = useState<string>("10");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [payoutHolder, setPayoutHolder] = useState("");

  const setLic = (patch: Partial<LicenseTerms>) => setLicTerms((prev) => ({ ...prev, ...patch }));
  const applyPreset = (type: LicenseType) => {
    setLicType(type);
    const preset = presetForType(type);
    setLicTerms(preset);
    setPresetSnapshot(preset);
    setLicMaxStreams("");
  };

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: cats } = useQuery({
    queryKey: ["cats-sell"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const isOtherCategory = (cats ?? []).some((c: any) => c.id === categoryId && c.slug === "other");

  const { data: sellerProfile } = useQuery({
    queryKey: ["seller-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () =>
      (
        await supabase
          .from("profiles")
          .select("display_name, username")
          .eq("id", user!.id)
          .maybeSingle()
      ).data as any,
  });
  const sellerName =
    sellerProfile?.display_name?.trim() || sellerProfile?.username?.trim() || "PREVIEW";

  const { data: payoutRow } = useQuery({
    queryKey: ["seller-payout", user?.id],
    enabled: !!user?.id,
    queryFn: async () =>
      (
        await (supabase as any)
          .from("seller_payouts")
          .select("payout_account, payout_holder")
          .eq("user_id", user!.id)
          .maybeSingle()
      ).data as any,
  });

  useEffect(() => {
    if (!payoutRow) return;
    setPayoutAccount((prev) => prev || payoutRow.payout_account || "");
    setPayoutHolder((prev) => prev || payoutRow.payout_holder || "");
  }, [payoutRow]);

  const validateFile = useServerFn(validateUploadedFile);
  const reviewListingFn = useServerFn(reviewListing);

  const handleGenerateWatermark = async () => {
    if (!sampleFile) {
      toast.error("Najpierw wgraj plik próbki (obraz) — na nim nałożymy znak wodny.");
      return;
    }
    const imgErr = checkImageFile(sampleFile);
    if (imgErr) {
      toast.error(`Próbka musi być obrazem (JPG/PNG/WebP/GIF): ${imgErr}`);
      return;
    }
    setGeneratingWatermark(true);
    try {
      const watermarked = await generateWatermarkedImage(sampleFile, sellerName);
      setSampleFile(watermarked);
      toast.success("Znak wodny nałożony na próbkę.");
    } catch (err: any) {
      toast.error(err?.message ?? "Nie udało się wygenerować znaku wodnego");
    } finally {
      setGeneratingWatermark(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!previewFile) {
      return toast.error("Wgraj okładkę produktu — to pole jest wymagane.");
    }
    if (productFiles.length === 0) {
      return toast.error("Wgraj plik produktu — to pole jest wymagane.");
    }
    if (!categoryId) {
      return toast.error("Wybierz kategorię produktu — to pole jest wymagane.");
    }
    if (isOtherCategory && customCategory.trim().length < 3) {
      return toast.error(
        'Wybrałeś kategorię „Inne" — wpisz własną nazwę kategorii (min. 3 znaki).',
      );
    }

    const accountNormalized = payoutAccount.replace(/\s+/g, "").toUpperCase();
    if (!/^(PL)?\d{26}$/.test(accountNormalized)) {
      return toast.error(
        "Podaj poprawny numer konta bankowego (26 cyfr, opcjonalnie z prefiksem PL).",
      );
    }
    if (payoutHolder.trim().length < 3) {
      return toast.error("Podaj imię i nazwisko (lub nazwę firmy) właściciela konta.");
    }
    const holderError = validateCleanText(payoutHolder, "Właściciel konta");
    if (holderError) return toast.error(holderError);

    // Client-side guard (defense-in-depth; server re-validates)
    if (previewFile) {
      const err = checkImageFile(previewFile);
      if (err) return toast.error(`Preview: ${err}`);
    }
    if (sampleFile) {
      const err = checkProductFile(sampleFile);
      if (err) return toast.error(`Sample: ${err}`);
    }
    for (const productFile of productFiles) {
      const err = checkProductFile(productFile);
      if (err) return toast.error(`File: ${err}`);
    }

    const dm = (licTerms.delivery_mode ?? "download") as DeliveryMode;
    if ((dm === "stream" || dm === "both") && !isStreamableFile(productFiles[0])) {
      return toast.error(
        `Wybrałeś sposób dostarczenia „${DELIVERY_MODE_LABELS[dm]}", ale główny plik „${productFiles[0]?.name ?? ""}" nie jest obsługiwany przez przeglądarkowy odtwarzacz. ` +
          `Streaming działa tylko dla audio/wideo (${STREAMABLE_EXT.join(", ")}). Zmień plik lub wybierz „Tylko pobieranie".`,
        { duration: 8000 },
      );
    }

    setSubmitting(true);
    try {
      // Persist payout details for future payouts
      await (supabase as any).from("seller_payouts").upsert(
        {
          user_id: user.id,
          payout_account: accountNormalized,
          payout_holder: payoutHolder.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      let preview_url: string | null = null;
      let file_path: string | null = null;
      const file_paths: string[] = [];
      let sample_url: string | null = null;

      if (previewFile) {
        const path = `${user.id}/${Date.now()}-${previewFile.name}`;
        const { error } = await supabase.storage.from("product-previews").upload(path, previewFile);
        if (error) throw error;
        // Server-side magic-byte validation; deletes the file if it's not a real image.
        await validateFile({ data: { bucket: "product-previews", path, kind: "image" } });
        preview_url = supabase.storage.from("product-previews").getPublicUrl(path).data.publicUrl;
      }
      if (sampleFile) {
        const path = `${user.id}/sample-${Date.now()}-${sampleFile.name}`;
        const { error } = await supabase.storage.from("product-previews").upload(path, sampleFile);
        if (error) throw error;
        await validateFile({ data: { bucket: "product-previews", path, kind: "any" } });
        sample_url = supabase.storage.from("product-previews").getPublicUrl(path).data.publicUrl;
      }
      for (const productFile of productFiles) {
        const path = `${user.id}/${Date.now()}-${productFile.name}`;
        const { error } = await supabase.storage.from("product-files").upload(path, productFile);
        if (error) throw error;
        await validateFile({ data: { bucket: "product-files", path, kind: "any" } });
        file_paths.push(path);
      }
      file_path = file_paths[0] ?? null;

      const { data, error } = await supabase
        .from("products")
        .insert({
          seller_id: user.id,
          title,
          description,
          price: parseFloat(price) || 0,
          category_id: categoryId || null,
          custom_category: isOtherCategory ? customCategory.trim() : null,

          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          is_tradable: tradable,
          affiliate_commission_pct: Math.max(
            0,
            Math.min(50, parseInt(affiliatePct || "0", 10) || 0),
          ),
          preview_url,
          sample_url,
          file_path,
          file_paths,
          status: "pending_review",
          license_terms: {
            ...licTerms,
            license_type: licType,
            exclusive: licType === "exclusive" || !!licTerms.exclusive,
            max_streams: licMaxStreams ? parseInt(licMaxStreams, 10) : null,
            max_end_products:
              licTerms.commercial_use === false ? undefined : licTerms.max_end_products,
            custom_terms: licCustom,
          },
        } as any)
        .select()
        .single();

      if (error) throw error;
      const review = await reviewListingFn({ data: { productId: data.id } });
      toast.success(
        review.autoApproved
          ? "Produkt został automatycznie zweryfikowany i opublikowany."
          : "Produkt wysłany do weryfikacji przez administratora.",
      );
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Błąd publikacji");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="container mx-auto px-4 py-10 flex-1 max-w-3xl">
          <h1 className="font-display text-4xl font-bold">Wystaw produkt</h1>
          <p className="text-muted-foreground mt-1">Podziel się swoją pracą ze społecznością.</p>

          <form
            onSubmit={submit}
            className="mt-8 space-y-5 rounded-2xl bg-gradient-surface border border-border/40 p-6"
          >
            <div className="space-y-2">
              <Label>Tytuł *</Label>
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Opis</Label>
              <Textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cena (PLN)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Kategoria <span className="text-destructive">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {cats?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isOtherCategory && (
                  <div className="space-y-1 pt-1">
                    <Label>
                      Własna kategoria <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="np. presety Lightroom, sample pack, plansze do druku"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      Wybrałeś „Inne" — wpisz własną nazwę kategorii. Pomaga to kupującym znaleźć
                      Twój produkt w wyszukiwarce.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tagi (oddzielone przecinkami)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="design, ui, dark"
              />
            </div>
            <div className="space-y-2 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <Label className="flex items-center gap-2">
                💸 Prowizja partnerska (%)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                    Ustaw ile procent (0–50) od ceny sprzedaży dostanie użytkownik, który poleci
                    Twój produkt swoim linkiem afiliacyjnym. 0% = brak programu partnerskiego —
                    trudniej wtedy o promocję produktu. Platforma dolicza swoją marżę 10% do ceny
                    niezależnie od prowizji partnera.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="number"
                min="0"
                max="50"
                step="1"
                value={affiliatePct}
                onChange={(e) => setAffiliatePct(e.target.value)}
                placeholder="np. 15"
              />
              {(() => {
                const net = parseFloat(price) || 0;
                const pct = Math.max(0, Math.min(50, parseInt(affiliatePct || "0", 10) || 0));
                const buyerPrice = buyerPriceOf(net);
                const commission = +(net * (pct / 100)).toFixed(2);
                const sellerGets = +(net - commission).toFixed(2);
                return (
                  <div className="rounded-md border border-border/40 bg-background/40 p-2 text-[11px] leading-relaxed">
                    <p className="text-foreground">
                      Cena dla kupującego:{" "}
                      <span className="font-medium">{buyerPrice.toFixed(2)} PLN</span> · Prowizja
                      partnera: <span className="font-medium">{commission.toFixed(2)} PLN</span> ·
                      Otrzymasz: <span className="font-medium">{net.toFixed(2)} PLN</span>
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Doliczana przez platformę marża 10% jest dodawana do Twojej ceny netto (płaci
                      ją kupujący) — prowizja partnerska jest natomiast finansowana z marży
                      platformy, więc nie pomniejsza Twojej ceny netto.
                    </p>
                  </div>
                );
              })()}
              <p className="text-[11px] text-muted-foreground">
                0% oznacza brak zachęty dla partnerów — taki produkt jest dużo trudniej wypromować.
                Polecamy 10–20%.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Okładka (obraz){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)}
                />
                {previewFile && (
                  <p className="text-xs text-muted-foreground truncate">✓ {previewFile.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Plik produktu{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Możesz wybrać kilka plików naraz. Pierwszy będzie plikiem głównym.
                </p>
                <Input
                  type="file"
                  multiple
                  required
                  onChange={(e) => setProductFiles(Array.from(e.target.files ?? []))}
                />
                {productFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    ✓ {productFiles.map((file) => file.name).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <Label className="text-base">Próbka z zabezpieczeniem (opcjonalnie)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Wgraj wersję demo z znakiem wodnym lub krótki fragment (np. beat z voice tagiem,
                    PDF z watermarkiem, niska jakość). Kupujący zobaczy/odsłucha tę próbkę przed
                    zakupem — pełny plik dostanie dopiero po opłaceniu.
                  </p>
                </div>
              </div>
              <Input
                type="file"
                accept="audio/*,video/*,image/*,application/pdf"
                onChange={(e) => setSampleFile(e.target.files?.[0] ?? null)}
              />
              <div className="rounded-md border border-dashed border-accent/40 bg-background/40 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Droplets className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Automatyczny znak wodny</p>
                    <p className="mt-0.5">
                      Nałóż na wgraną próbkę (obraz) Twoją nazwę (
                      <span className="font-medium text-foreground">{sellerName}</span>) po skosie,
                      w dużym rozmiarze.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={generatingWatermark || !sampleFile}
                  onClick={handleGenerateWatermark}
                  className="w-full"
                >
                  {generatingWatermark ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generuję...
                    </>
                  ) : (
                    <>
                      <Droplets className="h-4 w-4 mr-2" /> Nałóż znak wodny na próbkę
                    </>
                  )}
                </Button>
                {sampleFile && (
                  <p className="text-xs text-muted-foreground truncate">
                    Aktualna próbka: <span className="text-foreground">{sampleFile.name}</span>
                  </p>
                )}
                {!sampleFile && (
                  <p className="text-[11px] text-muted-foreground">
                    Najpierw wgraj plik próbki (obraz) powyżej.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <Label className="text-base">Licencja</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Wybierz typ licencji i dopasuj opcje. Aplikacja automatycznie wygeneruje
                    profesjonalny tekst umowy, który pojawi się na stronie produktu i w PDF
                    dołączanym do każdego zamówienia.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">Typ licencji</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(LICENSE_TYPE_LABELS) as LicenseType[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => applyPreset(k)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        licType === k
                          ? "border-primary bg-primary/15 text-foreground shadow-glow"
                          : "border-border/40 bg-background/40 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {LICENSE_TYPE_LABELS[k]}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Wybór typu ustawi sensowne domyślne opcje — możesz je dowolnie zmienić poniżej.
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs">Sposób dostarczenia pliku</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                      {LICENSE_OPTION_HELP.delivery_mode}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={(licTerms.delivery_mode ?? "download") as DeliveryMode}
                  onValueChange={(v) => {
                    const next = v as DeliveryMode;
                    if (
                      (next === "stream" || next === "both") &&
                      productFiles[0] &&
                      !isStreamableFile(productFiles[0])
                    ) {
                      toast.error(
                        `Nie możesz wybrać „${DELIVERY_MODE_LABELS[next]}" dla pliku „${productFiles[0].name}". ` +
                          `Streaming w przeglądarce działa tylko dla audio i wideo (${STREAMABLE_EXT.join(", ")}). ` +
                          `Wgraj inny plik albo zostaw „Tylko pobieranie".`,
                        { duration: 8000 },
                      );
                      return;
                    }
                    setLic({ delivery_mode: next });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DELIVERY_MODE_LABELS) as DeliveryMode[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {DELIVERY_MODE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="rounded-md border border-border/40 bg-background/40 p-2 text-[11px] leading-relaxed text-muted-foreground space-y-1">
                  <div>
                    <span className="text-foreground font-medium">Streaming na stronie</span> —
                    obsługiwane formaty:{" "}
                    <span className="text-foreground">{STREAMABLE_EXT.join(", ")}</span> (audio /
                    wideo).
                  </div>
                  <div>
                    <span className="text-foreground font-medium">Tylko pobieranie</span> — dowolny
                    plik, m.in. {DOWNLOAD_ONLY_HINT}
                  </div>
                  <div>
                    Jeśli Twój plik nie jest audio ani wideo, wybierz „Tylko pobieranie" — inaczej
                    kupujący nie odtworzy go w przeglądarce.
                  </div>
                  {productFiles[0] && !isStreamableFile(productFiles[0]) && (
                    <div className="text-destructive">
                      Główny plik „{productFiles[0].name}" nie jest obsługiwany przez streaming —
                      dostępna tylko opcja „Tylko pobieranie".
                    </div>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                {(
                  [
                    ["commercial_use", "Dozwolony użytek komercyjny"],
                    ["private_use", "Dozwolony użytek prywatny"],
                    ["can_modify", "Można modyfikować plik"],
                    ["use_in_client_projects", "Można używać w projektach klientów"],
                    ["use_for_ai", "Można używać do AI"],
                    ["train_ai", "Można trenować AI"],
                    ["create_nft", "Można tworzyć NFT"],
                    ["attribution_required", "Wymagane podanie autora"],
                    ["redistribution", "Dozwolona redystrybucja"],
                    ["resale", "Dozwolona odsprzedaż"],
                  ] as [keyof LicenseTerms, string][]
                ).map(([key, label]) => {
                  const warning = contradictionWarning(key as string, licTerms, licType);
                  const deviates = deviatesFromPreset(key, licTerms, presetSnapshot);
                  return (
                    <div key={key as string} className="space-y-0.5">
                      <label className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-background/40">
                        <Checkbox
                          checked={!!licTerms[key]}
                          onCheckedChange={(v) => setLic({ [key]: !!v } as any)}
                        />
                        <span className="text-sm flex-1">{label}</span>
                        <HelpIcon help={LICENSE_OPTION_HELP[key as string]} />
                      </label>
                      {key === "attribution_required" && licTerms.attribution_required && (
                        <div className="pl-8 pr-2 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Label className="text-[11px] text-muted-foreground">
                              Oczekiwana forma podpisu
                            </Label>
                            <HelpIcon help={LICENSE_OPTION_HELP.attribution_format} />
                          </div>
                          <Input
                            value={licTerms.attribution_format ?? ""}
                            onChange={(e) => setLic({ attribution_format: e.target.value })}
                            placeholder="np. „Zdjęcie: nazwa/link”"
                            className="h-8 text-xs"
                          />
                        </div>
                      )}
                      {warning && <p className="pl-8 pr-2 text-[11px] text-amber-500">{warning}</p>}
                      {!warning && (
                        <div className="pl-8 pr-2">
                          <DeviationNote show={deviates} licType={licType} />
                        </div>
                      )}
                    </div>
                  );
                })}
                <label className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-background/40">
                  <Checkbox
                    checked={(licTerms.territory_preset ?? "worldwide") === "worldwide"}
                    onCheckedChange={(v) =>
                      setLic(
                        v
                          ? { territory_preset: "worldwide", territory: undefined }
                          : { territory_preset: "other" },
                      )
                    }
                  />
                  <span className="text-sm flex-1">Licencja na cały świat</span>
                  <HelpIcon help={LICENSE_OPTION_HELP.worldwide} />
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <HelpLabel
                    text="Maksymalna liczba użytkowników"
                    help={LICENSE_OPTION_HELP.max_users}
                  />
                  <Select
                    value={licTerms.max_users ?? "unlimited"}
                    onValueChange={(v) => setLic({ max_users: v as LicenseLimit })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="unlimited">Bez limitu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <HelpLabel
                    text="Maksymalna liczba projektów"
                    help={LICENSE_OPTION_HELP.max_projects}
                  />
                  <Select
                    value={licTerms.max_projects ?? "unlimited"}
                    onValueChange={(v) => setLic({ max_projects: v as LicenseLimit })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="unlimited">Bez limitu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {licTerms.commercial_use !== false && (
                  <div className="space-y-1">
                    <HelpLabel
                      text="Maks. liczba sprzedanych produktów końcowych"
                      help={LICENSE_OPTION_HELP.max_end_products}
                    />
                    <Select
                      value={licTerms.max_end_products ?? "unlimited"}
                      onValueChange={(v) => setLic({ max_end_products: v as LicenseLimit })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="5000">5 000</SelectItem>
                        <SelectItem value="50000">50 000</SelectItem>
                        <SelectItem value="unlimited">Bez limitu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1">
                  <HelpLabel
                    text="Czas obowiązywania licencji"
                    help={LICENSE_OPTION_HELP.duration}
                  />
                  <Select
                    value={licTerms.duration ?? "perpetual"}
                    onValueChange={(v) => setLic({ duration: v as LicenseDuration })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LICENSE_DURATION_LABELS) as LicenseDuration[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {LICENSE_DURATION_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <HelpLabel
                    text="Limit odtworzeń (puste = bez limitu)"
                    help={LICENSE_OPTION_HELP.max_streams}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="np. 100000"
                    value={licMaxStreams}
                    onChange={(e) => setLicMaxStreams(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <HelpLabel text="Terytorium" help={LICENSE_OPTION_HELP.territory} />
                  <Select
                    value={licTerms.territory_preset ?? "worldwide"}
                    onValueChange={(v) =>
                      setLic({
                        territory_preset: v as TerritoryPreset,
                        territory: v === "other" ? licTerms.territory : undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TERRITORY_PRESET_LABELS) as TerritoryPreset[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {TERRITORY_PRESET_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {licTerms.territory_preset === "other" && (
                    <Input
                      value={licTerms.territory ?? ""}
                      onChange={(e) => setLic({ territory: e.target.value })}
                      placeholder="np. Polska, Niemcy, Czechy"
                    />
                  )}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Postanowienia dodatkowe (opcjonalne)</Label>
                  <Textarea
                    rows={3}
                    value={licCustom}
                    onChange={(e) => setLicCustom(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border/40 bg-background/50 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Podgląd wygenerowanej licencji
                </div>
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono max-h-56 overflow-auto text-foreground/80">
                  {generateLicenseText({
                    terms: {
                      ...licTerms,
                      license_type: licType,
                      custom_terms: licCustom,
                      max_streams: licMaxStreams ? parseInt(licMaxStreams, 10) : null,
                    },
                    productTitle: title || "[tytuł produktu]",
                    sellerName,
                  })}
                </pre>
              </div>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-3">
              <Label className="text-base">Dane do wypłaty *</Label>
              <p className="text-xs text-muted-foreground">
                Numer konta jest wymagany — na niego trafią środki po zatwierdzeniu zakupu przez
                kupującego. Dane są zapisywane w Twoim profilu i widoczne tylko dla Ciebie i
                administracji.
              </p>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">Właściciel konta *</Label>
                <Input
                  required
                  value={payoutHolder}
                  onChange={(e) => setPayoutHolder(e.target.value)}
                  placeholder="Imię i nazwisko lub nazwa firmy"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">Numer konta (IBAN) *</Label>
                <Input
                  required
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value.toUpperCase())}
                  placeholder="PL00 0000 0000 0000 0000 0000 0000"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
              <Switch checked={tradable} onCheckedChange={setTradable} id="tradable" />
              <Label htmlFor="tradable" className="cursor-pointer">
                Pozwól na wymianę
              </Label>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-gradient-primary text-primary-foreground shadow-glow"
            >
              {submitting ? "Publikuję..." : "Opublikuj produkt"}
            </Button>
          </form>
        </main>
        <SiteFooter />
      </div>
    </TooltipProvider>
  );
}
