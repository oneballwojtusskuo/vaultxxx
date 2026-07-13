import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, ShieldCheck, FileText, Droplets, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useServerFn } from "@tanstack/react-start";
import { validateUploadedFile } from "@/lib/upload-validate.functions";

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
  const fontSize = Math.max(28, Math.floor(diag / (Math.max(6, text.length * 0.9))));
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
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Nie udało się wygenerować pliku"))), "image/jpeg", 0.85),
  );
  const base = source.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}-watermark.jpg`, { type: "image/jpeg" });
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
  const [tags, setTags] = useState("");
  const [tradable, setTradable] = useState(true);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [generatingWatermark, setGeneratingWatermark] = useState(false);
  const [licCommercial, setLicCommercial] = useState(false);
  const [licExclusive, setLicExclusive] = useState(false);
  const [licAttribution, setLicAttribution] = useState(true);
  const [licMaxStreams, setLicMaxStreams] = useState("");
  const [licTerritory, setLicTerritory] = useState("worldwide");
  const [licCustom, setLicCustom] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: cats } = useQuery({
    queryKey: ["cats-sell"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: sellerProfile } = useQuery({
    queryKey: ["seller-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () =>
      (await supabase.from("profiles").select("display_name, username").eq("id", user!.id).maybeSingle()).data,
  });
  const sellerName =
    sellerProfile?.display_name?.trim() ||
    sellerProfile?.username?.trim() ||
    (user?.email ? user.email.split("@")[0] : "PREVIEW");

  const validateFile = useServerFn(validateUploadedFile);

  const handleGenerateWatermark = async () => {
    if (!previewFile) {
      toast.error("Najpierw wgraj okładkę produktu — z niej wygenerujemy próbkę.");
      return;
    }
    const imgErr = checkImageFile(previewFile);
    if (imgErr) {
      toast.error(`Okładka: ${imgErr}`);
      return;
    }
    setGeneratingWatermark(true);
    try {
      const watermarked = await generateWatermarkedImage(previewFile, sellerName);
      setSampleFile(watermarked);
      toast.success("Próbka ze znakiem wodnym wygenerowana.");
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
    if (!productFile) {
      return toast.error("Wgraj plik produktu — to pole jest wymagane.");
    }



    // Client-side guard (defense-in-depth; server re-validates)
    if (previewFile) {
      const err = checkImageFile(previewFile);
      if (err) return toast.error(`Preview: ${err}`);
    }
    if (sampleFile) {
      const err = checkProductFile(sampleFile);
      if (err) return toast.error(`Sample: ${err}`);
    }
    if (productFile) {
      const err = checkProductFile(productFile);
      if (err) return toast.error(`File: ${err}`);
    }

    setSubmitting(true);
    try {
      let preview_url: string | null = null;
      let file_path: string | null = null;
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
      if (productFile) {
        const path = `${user.id}/${Date.now()}-${productFile.name}`;
        const { error } = await supabase.storage.from("product-files").upload(path, productFile);
        if (error) throw error;
        await validateFile({ data: { bucket: "product-files", path, kind: "any" } });
        file_path = path;
      }

      const { data, error } = await supabase.from("products").insert({
        seller_id: user.id,
        title,
        description,
        price: parseFloat(price) || 0,
        category_id: categoryId || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        is_tradable: tradable,
        preview_url,
        sample_url,
        file_path,
        status: "pending_review",
        license_terms: {
          commercial_use: licCommercial,
          exclusive: licExclusive,
          attribution_required: licAttribution,
          max_streams: licMaxStreams ? parseInt(licMaxStreams, 10) : null,
          territory: licTerritory,
          custom_terms: licCustom,
        },
      } as any).select().single();

      if (error) throw error;
      toast.success("Produkt wysłany do weryfikacji przez administratora!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Błąd publikacji");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-3xl">
        <h1 className="font-display text-4xl font-bold">Wystaw produkt</h1>
        <p className="text-muted-foreground mt-1">Podziel się swoją pracą ze społecznością.</p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl bg-gradient-surface border border-border/40 p-6">
          <div className="space-y-2">
            <Label>Tytuł *</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Opis</Label>
            <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cena (PLN)</Label>
              <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                <SelectContent>
                  {cats?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tagi (oddzielone przecinkami)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="design, ui, dark" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Okładka (obraz) <span className="text-destructive">*</span>
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
                <Upload className="h-4 w-4" /> Plik produktu <span className="text-destructive">*</span>
              </Label>
              <Input
                type="file"
                required
                onChange={(e) => setProductFile(e.target.files?.[0] ?? null)}
              />
              {productFile && (
                <p className="text-xs text-muted-foreground truncate">✓ {productFile.name}</p>
              )}
            </div>
          </div>
          <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-accent mt-0.5 shrink-0" />
              <div>
                <Label className="text-base">Próbka z zabezpieczeniem (opcjonalnie)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Wgraj wersję demo z znakiem wodnym lub krótki fragment (np. beat z voice tagiem, PDF z watermarkiem, niska jakość). Kupujący zobaczy/odsłucha tę próbkę przed zakupem — pełny plik dostanie dopiero po opłaceniu.
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
                    Wygeneruj próbkę z okładki z Twoją nazwą (<span className="font-medium text-foreground">{sellerName}</span>) nadrukowaną po skosie na obrazie.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={generatingWatermark || !previewFile}
                onClick={handleGenerateWatermark}
                className="w-full"
              >
                {generatingWatermark ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generuję...</>
                ) : (
                  <><Droplets className="h-4 w-4 mr-2" /> Wygeneruj znak wodny z okładki</>
                )}
              </Button>
              {sampleFile && (
                <p className="text-xs text-muted-foreground truncate">
                  Aktualna próbka: <span className="text-foreground">{sampleFile.name}</span>
                </p>
              )}
              {!previewFile && (
                <p className="text-[11px] text-muted-foreground">Najpierw wgraj okładkę powyżej.</p>
              )}
            </div>
          </div>
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <Label className="text-base">Warunki licencji</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Po zakupie kupujący otrzyma automatycznie wygenerowany PDF z licencją zawierający te warunki, jego dane i hash transakcji.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={licCommercial} onCheckedChange={(v) => setLicCommercial(!!v)} />
                <span className="text-sm">Użytek komercyjny dozwolony</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={licExclusive} onCheckedChange={(v) => setLicExclusive(!!v)} />
                <span className="text-sm">Licencja wyłączna</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={licAttribution} onCheckedChange={(v) => setLicAttribution(!!v)} />
                <span className="text-sm">Wymagane oznaczenie autora</span>
              </label>
              <div className="space-y-1">
                <Label className="text-xs">Limit odtworzeń (puste = bez limitu)</Label>
                <Input type="number" min="0" placeholder="np. 100000" value={licMaxStreams} onChange={(e) => setLicMaxStreams(e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Terytorium</Label>
                <Input value={licTerritory} onChange={(e) => setLicTerritory(e.target.value)} placeholder="worldwide" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Postanowienia dodatkowe (opcjonalne)</Label>
                <Textarea rows={3} value={licCustom} onChange={(e) => setLicCustom(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
            <Switch checked={tradable} onCheckedChange={setTradable} id="tradable" />
            <Label htmlFor="tradable" className="cursor-pointer">Pozwól na wymianę 1:1</Label>
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-12 bg-gradient-primary text-primary-foreground shadow-glow">
            {submitting ? "Publikuję..." : "Opublikuj produkt"}
          </Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
