import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
});

function Notifications() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: notifications, refetch } = useQuery({
    queryKey: ["notifications-all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const markAllRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) return toast.error(error.message);
    refetch();
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
  };

  const dismiss = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
  };

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null);
    if (error) return;
    refetch();
    qc.invalidateQueries({ queryKey: ["unread-notifications"] });
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Powiadomienia</h1>
            <p className="text-muted-foreground mt-1">Wiadomości, nowe produkty od obserwowanych twórców i inne alerty.</p>
          </div>
          <Button variant="outline" onClick={markAllRead}><Check className="h-4 w-4 mr-2"/> Oznacz wszystkie jako przeczytane</Button>
        </div>

        <div className="mt-8 space-y-2">
          {(!notifications || notifications.length === 0) && (
            <div className="text-center text-muted-foreground py-16 rounded-xl border border-dashed border-border/50">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Nic tu jeszcze nie ma.
            </div>
          )}
          {notifications?.map((n) => {
            const unread = !n.read_at;
            const Wrapper = ({ children }: { children: React.ReactNode }) =>
              n.link ? (
                <a href={n.link} className="flex-1 min-w-0">{children}</a>
              ) : (
                <div className="flex-1 min-w-0">{children}</div>
              );
            return (
              <div
                key={n.id}
                onClick={() => unread && markRead(n.id)}
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${
                  unread ? "border-primary/40 bg-primary/5" : "border-border/40 bg-gradient-surface"
                }`}
              >
                <Wrapper>
                  <p className="font-semibold">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground line-clamp-2">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pl-PL")}</p>
                </Wrapper>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); dismiss(n.id); }} aria-label="Usuń">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
