import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/messages/$userId")({
  component: Conversation,
});

function Conversation() {
  const { userId: otherId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: other } = useQuery({
    queryKey: ["profile-by-id", otherId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", otherId)
        .maybeSingle();
      return data;
    },
  });

  const { data: messages, refetch } = useQuery({
    queryKey: ["conversation", user?.id, otherId],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${uid},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${uid})`)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  // mark unread as read
  useEffect(() => {
    if (!user || !messages) return;
    const unread = messages.filter((m) => m.recipient_id === user.id && !m.read_at).map((m) => m.id);
    if (unread.length === 0) return;
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {
      qc.invalidateQueries({ queryKey: ["unread-messages"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    });
  }, [messages, user, qc]);

  // realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conv-${user.id}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherId, refetch]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading || !user) return null;

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: otherId,
      content,
    });
    if (error) {
      toast.error(error.message);
      setText(content);
      return;
    }
    refetch();
  };

  const name = other?.display_name ?? other?.username ?? "Użytkownik";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-6 flex-1 max-w-3xl w-full flex flex-col">
        <Link to="/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Wszystkie rozmowy
        </Link>

        <Link
          to="/u/$username"
          params={{ username: other?.username ?? "" }}
          className="flex items-center gap-3 rounded-xl bg-gradient-surface border border-border/40 p-3 hover:border-primary/40 transition-colors"
        >
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center">
            {other?.avatar_url ? (
              <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-foreground font-semibold text-sm">{initials}</span>
            )}
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            {other?.username && <p className="text-xs text-muted-foreground">@{other.username}</p>}
          </div>
        </Link>

        <div className="flex-1 mt-4 min-h-[400px] max-h-[60vh] overflow-y-auto space-y-2 p-2">
          {messages?.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              Rozpocznij rozmowę — napisz pierwszą wiadomość.
            </div>
          )}
          {messages?.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? "bg-gradient-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleString("pl-PL")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Napisz wiadomość..."
            className="min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button type="submit" className="bg-gradient-primary text-primary-foreground shadow-glow self-end">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
