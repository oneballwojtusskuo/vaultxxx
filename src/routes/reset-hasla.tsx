import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { VlndLogo } from "@/components/vlnd-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-hasla")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Ustaw nowe hasło — vlnd" },
      { name: "description", content: "Ustaw nowe hasło do swojego konta na vlnd — marketplace materiałów cyfrowych." },
      { property: "og:title", content: "Ustaw nowe hasło — vlnd" },
      { property: "og:description", content: "Bezpieczna zmiana hasła do konta vlnd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Hasło musi mieć min. 8 znaków.");
    if (password !== password2) return toast.error("Hasła nie są takie same.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Hasło zostało zmienione.");
    navigate({ to: "/browse" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-hero">
      <div className="w-full max-w-md rounded-2xl glass border border-border/40 p-6 shadow-elevated">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow p-1">
            <VlndLogo className="h-full w-full" />
          </div>
          <span className="font-display text-2xl font-bold lowercase">vlnd</span>
        </div>

        <h1 className="font-display text-xl font-bold flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-accent" /> Ustaw nowe hasło
        </h1>

        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Otwórz tę stronę z linku wysłanego na Twój adres e-mail. Jeśli link wygasł, poproś o nowy na stronie logowania.
          </p>
        ) : (
          <form onSubmit={save} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Nowe hasło</Label>
              <Input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Powtórz nowe hasło</Label>
              <Input type="password" minLength={8} required value={password2} onChange={(e) => setPassword2(e.target.value)} />
              {password2.length > 0 && password2 !== password && (
                <p className="text-xs text-destructive">Hasła nie są takie same.</p>
              )}
            </div>
            <Button disabled={saving} type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
              Zapisz nowe hasło
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
