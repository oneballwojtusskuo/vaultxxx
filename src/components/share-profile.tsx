import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Share2, Copy, ExternalLink } from "lucide-react";
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
    toast.error("Nie udało się skopiować. Link: " + url);
  }
}

export function ShareProfileButton({ username, name }: { username: string; name: string }) {
  const url = profileUrl(username);
  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${name} na vlnd`, text: `Zobacz materiały ${name} na vlnd`, url });
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") return;
      }
    }
    copy(url);
  };
  return (
    <Button variant="outline" onClick={share}>
      <Share2 className="h-4 w-4 mr-2" /> Udostępnij
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
        <Button onClick={() => copy(url)} className="bg-gradient-primary text-primary-foreground">
          <Copy className="h-4 w-4 mr-2" /> Kopiuj link
        </Button>
        <ShareProfileButton username={username} name={username} />
        <Link to="/u/$username" params={{ username }}>
          <Button variant="ghost"><ExternalLink className="h-4 w-4 mr-2" /> Podgląd</Button>
        </Link>
      </div>
    </div>
  );
}
