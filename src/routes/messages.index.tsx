import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/messages/")({
  component: Inbox,
});

function Inbox() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: conversations } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, content, read_at, created_at")
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(200);

      const map = new Map<string, { otherId: string; lastMessage: any; unread: number }>();
      for (const m of data ?? []) {
        const otherId = m.sender_id === user!.id ? m.recipient_id : m.sender_id;
        if (!map.has(otherId)) map.set(otherId, { otherId, lastMessage: m, unread: 0 });
        const entry = map.get(otherId)!;
        if (m.recipient_id === user!.id && !m.read_at) entry.unread += 1;
      }
      const ids = Array.from(map.keys());
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", ids);
      const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return Array.from(map.values()).map((c) => ({ ...c, profile: pmap.get(c.otherId) }));
    },
  });

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-3xl">
        <h1 className="font-display text-3xl font-bold">Wiadomości</h1>
        <p className="text-muted-foreground mt-1">Twoje rozmowy z innymi twórcami.</p>

        <div className="mt-8 space-y-2">
          {(!conversations || conversations.length === 0) && (
            <div className="text-center text-muted-foreground py-16 rounded-xl border border-dashed border-border/50">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Brak wiadomości. Odwiedź profil twórcy i napisz do niego.
            </div>
          )}
          {conversations?.map((c: any) => {
            const name = c.profile?.username ?? c.profile?.display_name ?? "Użytkownik";
            const initials = name.slice(0, 1).toUpperCase();
            return (
              <Link
                key={c.otherId}
                to="/messages/$userId"
                params={{ userId: c.otherId }}
                className="flex items-center gap-4 rounded-xl bg-gradient-surface border border-border/40 p-4 hover:border-primary/40 transition-colors"
              >
                <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center shrink-0">
                  {c.profile?.avatar_url ? (
                    <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-foreground font-semibold">{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(c.lastMessage.created_at).toLocaleString("pl-PL")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {c.lastMessage.sender_id === user.id ? "Ty: " : ""}
                    {c.lastMessage.content}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {c.unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
