import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copyright, Send, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";

const ABUSE_EMAIL = "vlndmarketplace@gmail.com";

const schema = z.object({
  name: z.string().trim().min(2, "Podaj imię i nazwisko").max(100),
  email: z.string().trim().email("Nieprawidłowy e-mail").max(255),
  productUrl: z.string().trim().min(1, "Podaj link do ogłoszenia lub produktu").max(500),
  rightsHolder: z.string().trim().min(2, "Podaj podmiot uprawniony").max(200),
  description: z.string().trim().min(20, "Opisz szczegóły naruszenia (min. 20 znaków)").max(4000),
  goodFaith: z.literal(true, {
    errorMap: () => ({ message: "Potwierdź oświadczenie" }),
  }),
});

export const Route = createFileRoute("/report-infringement")({
  head: () => ({
    meta: [
      { title: "Zgłoś naruszenie praw autorskich — vlnd" },
      {
        name: "description",
        content: "Formularz zgłaszania naruszeń praw autorskich w serwisie vlnd.",
      },
      { property: "og:title", content: "Zgłoś naruszenie praw autorskich — vlnd" },
      {
        property: "og:description",
        content: "Formularz zgłaszania naruszeń praw autorskich w serwisie vlnd.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportInfringementPage,
});

function ReportInfringementPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    productUrl: "",
    rightsHolder: "",
    description: "",
    goodFaith: false,
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Sprawdź formularz");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", parsed.data.name);
      fd.append("email", parsed.data.email);
      fd.append("_subject", `[vlnd naruszenie praw autorskich] ${parsed.data.productUrl}`);
      fd.append("_replyto", parsed.data.email);
      fd.append("_template", "table");
      fd.append("_captcha", "false");
      fd.append("productUrl", parsed.data.productUrl);
      fd.append("rightsHolder", parsed.data.rightsHolder);
      fd.append("description", parsed.data.description);
      fd.append("goodFaith", "Tak — zgłoszenie jest złożone w dobrej wierze");

      const res = await fetch(`https://formsubmit.co/ajax/${ABUSE_EMAIL}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      if (!res.ok) throw new Error("Nie udało się wysłać zgłoszenia");
      toast.success("Zgłoszenie wysłane. Sprawdzimy je i odpowiemy na podany adres e-mail.");
      setForm({
        name: "",
        email: "",
        productUrl: "",
        rightsHolder: "",
        description: "",
        goodFaith: false,
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Nie udało się wysłać. Napisz bezpośrednio na " + ABUSE_EMAIL);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Copyright className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold">Zgłoś naruszenie praw autorskich</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Jeśli znalazłeś ogłoszenie lub produkt, który narusza Twoje prawa autorskie, wypełnij
            poniższy formularz. Każde zgłoszenie weryfikujemy indywidualnie.
          </p>

          <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <div className="flex items-start gap-3 mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-500 mb-1">Ważne informacje</p>
                <p className="text-muted-foreground">
                  Złożenie fałszywego zgłoszenia może wiązać się z odpowiedzialnością cywilną lub
                  karną. Podaj dokładne dane i upewnij się, że jesteś uprawnionym podmiotem.
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Imię i nazwisko / podmiot uprawniony</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Twój e-mail kontaktowy</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={255}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="productUrl">Link do ogłoszenia / produktu</Label>
                <Input
                  id="productUrl"
                  type="url"
                  value={form.productUrl}
                  onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
                  maxLength={500}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rightsHolder">Tytuł / utwór, do którego przysługują prawa</Label>
                <Input
                  id="rightsHolder"
                  value={form.rightsHolder}
                  onChange={(e) => setForm({ ...form, rightsHolder: e.target.value })}
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Opis naruszenia i podstawa prawna</Label>
                <Textarea
                  id="description"
                  rows={6}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={4000}
                  required
                />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="goodFaith"
                  checked={form.goodFaith}
                  onCheckedChange={(checked) => setForm({ ...form, goodFaith: checked === true })}
                />
                <Label
                  htmlFor="goodFaith"
                  className="font-normal text-sm leading-relaxed cursor-pointer"
                >
                  Oświadczam, że posiadam dobre przekonanie co do tego, że materiał wskazany powyżej
                  jest wykorzystywany bez zgody właściciela praw autorskich lub jego
                  przedstawiciela, oraz że informacje zawarte w zgłoszeniu są dokładne i rzetelne.
                </Label>
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
                <a
                  href={`mailto:${ABUSE_EMAIL}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  albo napisz bezpośrednio: {ABUSE_EMAIL}
                </a>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-primary text-primary-foreground"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {loading ? "Wysyłanie…" : "Wyślij zgłoszenie"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
