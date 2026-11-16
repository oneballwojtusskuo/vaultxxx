import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-browser";

const SITE = "https://vlnd.pl";
export const profileUrl = (username: string) => `${SITE}/u/${encodeURIComponent(username)}`;

async function copy(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Skopiowano link do profilu — wklej go w bio na Instagramie");
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Skopiowano link do profilu — wklej go w bio na Instagramie");
    } catch {
      toast.error("Nie udało się skopiować. Link: " + url);
    }
  }
}

export function CopyProfileLinkButton({
  username,
  variant = "outline",
}: {
  username: string;
  variant?: "outline" | "default";
}) {
  const url = profileUrl(username);
  const [done, setDone] = useState(false);

  const onCopy = async () => {
    await copy(url);
    setDone(true);
    window.setTimeout(() => setDone(false), 2000);
  };

  return (
    <Button variant={variant} onClick={onCopy}>
      {done ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
      {done ? "Skopiowano" : "Kopiuj link"}
    </Button>
  );
}

export function MyProfileLinkCard({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["my-username", userId],
    queryFn: async () =>
      (await supabase.from("profiles").select("username").eq("id", userId).maybeSingle()).data,
  });
  const username = data?.username;
  if (!username) return null;
  const url = profileUrl(username);
  return (
    <div className="mt-6 rounded-2xl border border-border/40 bg-gradient-surface p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold">Twój link do profilu</p>
        <p className="text-sm text-muted-foreground">
          Wklej go w bio na Instagramie, TikToku czy w relacji — ludzie zobaczą wszystkie Twoje produkty.
        </p>
        <p className="mt-2 font-mono text-sm truncate">{url.replace("https://", "")}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <CopyProfileLinkButton username={username} variant="default" />
        <Link to="/u/$username" params={{ username }}>
          <Button variant="ghost"><ExternalLink className="h-4 w-4 mr-2" /> Podgląd</Button>
        </Link>
      </div>
    </div>
  );
}
