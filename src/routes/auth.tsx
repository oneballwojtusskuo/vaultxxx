import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { VlndLogo } from "@/components/vlnd-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" ? { next: s.next } : {},

  component: AuthPage,
});

// Only allow same-origin relative paths for post-auth return.
function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const nextPath = safeNext(next);
  const lovableAuth = createLovableAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [acceptDocs, setAcceptDocs] = useState(false);

  const [showSpamNotice, setShowSpamNotice] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const goNext = () => {
    if (nextPath) {
      window.location.href = nextPath;
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Zalogowano");
    goNext();
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) return toast.error("Podaj datę urodzenia.");
    const age = (Date.now() - new Date(birthDate).getTime()) / (365.2425 * 24 * 3600 * 1000);
    if (Number.isNaN(age)) return toast.error("Nieprawidłowa data urodzenia.");
    if (age < 16) return toast.error("Z vlnd mogą korzystać wyłącznie osoby, które ukończyły 16 lat.");
    if (!acceptDocs) return toast.error("Zaakceptuj regulamin i politykę prywatności.");
    setLoading(true);
    const redirectTo = nextPath
      ? `${window.location.origin}${nextPath}`
      : window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { display_name: displayName, date_of_birth: birthDate, age_confirmed_16: true },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setPendingEmail(email);
    setShowSpamNotice(true);
  };


  const google = async () => {
    setLoading(true);
    const redirectUri = nextPath
      ? `${window.location.origin}${nextPath}`
      : window.location.origin;
    const r = await lovableAuth.signInWithOAuth("google", { redirect_uri: redirectUri });
    if (r.error) {
      setLoading(false);
      toast.error("Logowanie Google nie powiodło się");
      return;
    }
    if (r.redirected) return;
    if (r.tokens) await supabase.auth.setSession(r.tokens);
    goNext();
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-hero">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow p-1">
            <VlndLogo className="h-full w-full" />
          </div>
          <span className="font-display text-2xl font-bold lowercase">vlnd</span>

        </Link>

        <div className="rounded-2xl glass border border-border/40 p-6 shadow-elevated">
          <Tabs defaultValue="signin">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="signin">Zaloguj</TabsTrigger>
              <TabsTrigger value="signup">Rejestracja</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hasło</Label>
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button disabled={loading} type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                  Zaloguj się
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nazwa wyświetlana</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hasło</Label>
                  <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Min. 8 znaków. Sprawdzamy bazę wyciekłych haseł.</p>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  📧 Po rejestracji otrzymasz email z linkiem aktywacyjnym. Musisz potwierdzić adres przed pierwszym logowaniem.
                </div>
                <Button disabled={loading} type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                  Utwórz konto
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            lub
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" disabled={loading} onClick={google} className="w-full">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.5 29.3 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.7 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.5 29.3 4.5 24 4.5 16.4 4.5 9.8 8.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.7 38.9 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.4-.4-4z"/></svg>
            Kontynuuj z Google
          </Button>
        </div>
      </div>

      <AlertDialog open={showSpamNotice} onOpenChange={setShowSpamNotice}>
        <AlertDialogContent className="glass border-primary/30">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
              <MailCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <AlertDialogTitle className="text-center">Sprawdź swoją skrzynkę email</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p className="text-center">
                  Wysłaliśmy link aktywacyjny na adres{" "}
                  <span className="font-semibold text-foreground">{pendingEmail}</span>.
                </p>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left">
                  <div className="flex gap-2">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
                    <div className="space-y-1.5">
                      <p className="font-semibold text-foreground">Nie widzisz maila?</p>
                      <p>
                        Sprawdź folder <span className="font-semibold text-foreground">SPAM</span> lub{" "}
                        <span className="font-semibold text-foreground">Oferty / Powiadomienia</span>.
                      </p>
                      <p>
                        Jeśli wiadomość tam jest — kliknij{" "}
                        <span className="font-semibold text-foreground">„To nie jest spam”</span>,
                        aby aktywacja konta zadziałała poprawnie.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
              Rozumiem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
