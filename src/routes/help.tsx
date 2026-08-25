import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, LifeBuoy, Send, Shield, Repeat, Users, Percent } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const SUPPORT_EMAIL = "vlndmarketplace@gmail.com";

const schema = z.object({
  name: z.string().trim().min(2, "Podaj imię").max(100),
  email: z.string().trim().email("Nieprawidłowy e-mail").max(255),
  subject: z.string().trim().min(3, "Podaj temat").max(200),
  message: z.string().trim().min(10, "Opisz problem (min. 10 znaków)").max(4000),
});

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Centrum pomocy — vlnd" },
      {
        name: "description",
        content:
          "Skontaktuj się z zespołem vlnd. Odpowiedzi na pytania o zakupy, sprzedaż, wymiany, afiliację i bezpieczeństwo.",
      },
      { property: "og:title", content: "Centrum pomocy — vlnd" },
      {
        property: "og:description",
        content: "Skontaktuj się z zespołem vlnd. FAQ i formularz kontaktowy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
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
      fd.append("_subject", `[vlnd pomoc] ${parsed.data.subject}`);
      fd.append("_replyto", parsed.data.email);
      fd.append("_template", "table");
      fd.append("_captcha", "false");
      fd.append("message", parsed.data.message);

      const res = await fetch(`https://formsubmit.co/ajax/${SUPPORT_EMAIL}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      if (!res.ok) throw new Error("Nie udało się wysłać wiadomości");
      toast.success("Wiadomość wysłana! Odezwiemy się na podany adres e-mail.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Nie udało się wysłać. Napisz bezpośrednio na " + SUPPORT_EMAIL);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <LifeBuoy className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold">Centrum pomocy</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Masz pytanie, zgłoszenie lub potrzebujesz pomocy? Napisz do nas — odpowiadamy
            najszybciej jak to możliwe.
          </p>

          <section className="grid sm:grid-cols-2 gap-4 mb-10">
            <FaqCard icon={<Shield className="h-4 w-4" />} title="Bezpieczeństwo (Escrow)">
              Środki kupującego trafiają do depozytu. Kupujący ma 24 godziny na potwierdzenie
              odbioru lub zgłoszenie problemu; po tym czasie środki są automatycznie zwalniane.
            </FaqCard>
            <FaqCard icon={<Repeat className="h-4 w-4" />} title="Wymiany">
              Możesz zaproponować wymianę pliku za plik. Dostęp odblokowuje się po obustronnym
              potwierdzeniu.
            </FaqCard>
            <FaqCard icon={<Users className="h-4 w-4" />} title="Afiliacja">
              Udostępniaj linki polecające produktów — dostajesz % prowizji od każdej sprzedaży z
              Twojego linku.
            </FaqCard>
            <FaqCard icon={<Percent className="h-4 w-4" />} title="Prowizja platformy">
              vlnd dolicza 10% do ceny sprzedawcy — to jedyna prowizja platformy, całą resztę
              otrzymuje twórca.
            </FaqCard>
          </section>

          <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4 text-accent" />
              <h2 className="font-display text-xl font-semibold">Formularz kontaktowy</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Wiadomości trafiają na <span className="text-foreground">{SUPPORT_EMAIL}</span>.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Imię</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Twój e-mail</Label>
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
                <Label htmlFor="subject">Temat</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Wiadomość</Label>
                <Textarea
                  id="message"
                  rows={7}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  maxLength={4000}
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  albo napisz bezpośrednio: {SUPPORT_EMAIL}
                </a>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-primary text-primary-foreground"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {loading ? "Wysyłanie…" : "Wyślij wiadomość"}
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

function FaqCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2 mb-1.5 text-sm font-semibold">
        <span className="text-accent">{icon}</span>
        {title}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
