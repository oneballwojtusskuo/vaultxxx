import { useEffect, useState } from "react";
import { validateUsername, validateCleanText } from "@/lib/profanity";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Sparkles, CheckCircle2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { validateUploadedFile } from "@/lib/upload-validate.functions";
import { uploadAvatarFile } from "@/lib/avatar-upload";

/**
 * Shown right after account creation: the user must pick a username,
 * optionally an avatar and a bio.
 */
export function OnboardingDialog() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [done, setDone] = useState(false);
  const isGuest = (user?.user_metadata as any)?.guest_checkout === "true";
  const validateFile = useServerFn(validateUploadedFile);

  const [confirmTab, setConfirmTab] = useState(false);
  useEffect(() => {
    const sync = () => setConfirmTab(sessionStorage.getItem("vlnd:confirm-tab") === "1");
    sync();
    window.addEventListener("vlnd:confirm-tab", sync);
    return () => window.removeEventListener("vlnd:confirm-tab", sync);
  }, []);

  useEffect(() => {
    if (loading || !user || confirmTab) {
      setOpen(false);
      return;
    }
    let cancelled = false;
    (supabase as any)
      .from("profiles" as any)
      .select("username, display_name, bio, avatar_url, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (cancelled || !data) return;
        if (data.onboarding_completed) return;
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? null);
        setOpen(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Wybierz plik graficzny (JPG, PNG, WEBP).");
    if (file.size > 5 * 1024 * 1024) return toast.error("Zdjęcie może mieć maksymalnie 5 MB.");
    setUploading(true);
    let path = "";
    let publicUrl = "";
    try {
      ({ path, publicUrl } = await uploadAvatarFile(file));
    } catch {
      setUploading(false);
      return toast.error("Nie udało się wgrać zdjęcia. Spróbuj ponownie za chwilę.");
    }
    try {
      await validateFile({ data: { bucket: "avatars", path, kind: "image" } });
    } catch (error: any) {
      setUploading(false);
      return toast.error(error?.message ?? "Niepoprawny plik zdjęcia.");
    }
    const data = { publicUrl };
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  const finish = async () => {
    if (!user) return;
    const uname = username.trim().toLowerCase();
    const unameError = validateUsername(uname);
    if (unameError) return toast.error(unameError);
    if (isGuest) {
      if (password.length < 8) return toast.error("Hasło musi mieć min. 8 znaków.");
      if (password !== password2) return toast.error("Hasła nie są takie same.");
    }
    const bioError = validateCleanText(bio, "Opis profilu");
    if (bioError) return toast.error(bioError);
    const nameError = validateCleanText(displayName, "Nazwa wyświetlana");
    if (nameError) return toast.error(nameError);

    setSaving(true);
    const { data: taken } = await supabase
      .from("profiles" as any)
      .select("id")
      .eq("username", uname)
      .neq("id", user.id)
      .maybeSingle();
    if (taken) {
      setSaving(false);
      return toast.error("Ta nazwa użytkownika jest już zajęta");
    }

    if (isGuest) {
      const { error: pwErr } = await supabase.auth.updateUser({
        password,
        data: { guest_checkout: "false" },
      });
      if (pwErr) {
        setSaving(false);
        return toast.error(pwErr.message);
      }
    }

    const { error } = await supabase
      .from("profiles" as any)
      .update({
        username: uname,
        display_name: displayName.trim() || uname,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        onboarding_completed: true,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    if (isGuest) {
      setDone(true);
      window.dispatchEvent(new Event("vlnd:purchase-refresh"));
      return;
    }
    toast.success("Profil gotowy! Witaj w vlnd 🎉");
    setOpen(false);
  };

  if (!user) return null;

  if (done) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <CheckCircle2 className="h-12 w-12 text-accent" />
            <DialogTitle className="font-display text-xl">Zakup został zrealizowany</DialogTitle>
            <DialogDescription>
              Dziękujemy! Konto jest gotowe, a kupiony plik czeka na Ciebie na stronie produktu i w
              zakładce Zakupy w Twoim panelu.
            </DialogDescription>
            <Button
              className="w-full bg-gradient-primary text-primary-foreground"
              onClick={() => setOpen(false)}
            >
              Pobierz zakupiony plik
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />{" "}
            {isGuest ? "Dokończ zakładanie konta" : "Skonfiguruj swój profil"}
          </DialogTitle>
          <DialogDescription>
            {isGuest
              ? "Płatność przyjęta. Ustaw nazwę użytkownika i hasło, aby zawsze mieć dostęp do zakupu."
              : "Nazwa użytkownika jest wymagana — pozostałe kroki możesz pominąć i uzupełnić później."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nazwa użytkownika *</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="np. john_doe"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Twój profil: vlnd.lovable.app/u/{username || "twoja_nazwa"}
            </p>
          </div>

          {isGuest && (
            <>
              <div>
                <Label>Hasło *</Label>
                <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 8 znaków" />
              </div>
              <div>
                <Label>Powtórz hasło *</Label>
                <Input type="password" minLength={8} value={password2} onChange={(e) => setPassword2(e.target.value)} />
                {password2.length > 0 && password2 !== password && (
                  <p className="text-xs text-destructive mt-1">Hasła nie są takie same.</p>
                )}
              </div>
            </>
          )}

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-foreground font-bold text-xl">
                  {(displayName || username || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <Label
                htmlFor="onboarding-avatar"
                className="cursor-pointer inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-2 hover:bg-accent/10"
              >
                <Upload className="h-4 w-4" />{" "}
                {uploading ? "Przesyłam..." : "Dodaj zdjęcie (opcjonalne)"}
              </Label>
              <input
                id="onboarding-avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
              />
            </div>
          </div>

          <div>
            <Label>Opis konta (opcjonalne)</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Krótko o sobie i o tym, co sprzedajesz..."
            />
          </div>

          <Button
            onClick={finish}
            disabled={saving || uploading}
            className="w-full bg-gradient-primary text-primary-foreground"
          >
            {saving ? "Zapisuję..." : "Zaczynamy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
