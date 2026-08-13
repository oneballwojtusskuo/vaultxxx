import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Sparkles } from "lucide-react";

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

  useEffect(() => {
    if (loading || !user) {
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
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  const finish = async () => {
    if (!user) return;
    const uname = username.trim().toLowerCase();
    if (uname.length < 3) return toast.error("Nazwa użytkownika musi mieć min. 3 znaki");

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
    toast.success("Profil gotowy! Witaj w vlnd 🎉");
    setOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Skonfiguruj swój profil
          </DialogTitle>
          <DialogDescription>
            Nazwa użytkownika jest wymagana — pozostałe kroki możesz pominąć i uzupełnić później.
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
            <p className="text-xs text-muted-foreground mt-1">Twój profil: vlnd.lovable.app/u/{username || "twoja_nazwa"}</p>
          </div>

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
                <Upload className="h-4 w-4" /> {uploading ? "Przesyłam..." : "Dodaj zdjęcie (opcjonalne)"}
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
            <Label>Wyświetlana nazwa (opcjonalne)</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Twoje imię lub pseudonim" />
          </div>

          <div>
            <Label>Opis konta (opcjonalne)</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Krótko o sobie i o tym, co sprzedajesz..." />
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
