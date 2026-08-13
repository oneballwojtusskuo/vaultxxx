import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Upload } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ProfileEditor() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setProfile(data);
        setDisplayName(data.display_name ?? "");
        setUsername(data.username ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      });
  }, [user, open]);

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

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Zapisano profil");
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {profile?.username && (
        <Link to="/u/$username" params={{ username: profile.username }}>
          <Button variant="outline" size="sm">Zobacz mój profil</Button>
        </Link>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1"/> Edytuj profil</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Twój profil publiczny</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover"/>
                ) : (
                  <span className="text-primary-foreground font-bold text-2xl">{(displayName || username || "?").slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm border border-border rounded-md px-3 py-2 hover:bg-accent/10">
                  <Upload className="h-4 w-4" /> {uploading ? "Przesyłam..." : "Zmień zdjęcie"}
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                />
              </div>
            </div>
            <div>
              <Label>Wyświetlana nazwa</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Twoje imię lub pseudonim" />
            </div>
            <div>
              <Label>Username (URL profilu)</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="np. john_doe" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Krótko o sobie..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground">Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
