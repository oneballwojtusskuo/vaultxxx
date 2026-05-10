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
import { Upload, ShieldCheck, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      let preview_url: string | null = null;
      let file_path: string | null = null;
      let sample_url: string | null = null;

      if (previewFile) {
        const path = `${user.id}/${Date.now()}-${previewFile.name}`;
        const { error } = await supabase.storage.from("product-previews").upload(path, previewFile);
        if (error) throw error;
        preview_url = supabase.storage.from("product-previews").getPublicUrl(path).data.publicUrl;
      }
      if (sampleFile) {
        const path = `${user.id}/sample-${Date.now()}-${sampleFile.name}`;
        const { error } = await supabase.storage.from("product-previews").upload(path, sampleFile);
        if (error) throw error;
        sample_url = supabase.storage.from("product-previews").getPublicUrl(path).data.publicUrl;
      }
      if (productFile) {
        const path = `${user.id}/${Date.now()}-${productFile.name}`;
        const { error } = await supabase.storage.from("product-files").upload(path, productFile);
        if (error) throw error;
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
        status: "published",
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
      toast.success("Produkt opublikowany!");
      navigate({ to: "/product/$id", params: { id: data.id } });
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
              <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Okładka (obraz)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Upload className="h-4 w-4" /> Plik produktu</Label>
              <Input type="file" onChange={(e) => setProductFile(e.target.files?.[0] ?? null)} />
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
            <Input type="file" accept="audio/*,video/*,image/*,application/pdf" onChange={(e) => setSampleFile(e.target.files?.[0] ?? null)} />
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
