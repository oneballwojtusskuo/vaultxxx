import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Send, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { getDisputeChat, resolveDispute, sendDisputeMessage } from "@/lib/dispute.functions";

export const Route = createFileRoute("/spory/$transactionId")({
  component: DisputeChat,
});

type DisputeChatData = Awaited<ReturnType<typeof getDisputeChat>>;

function DisputeChat() {
  const { transactionId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const getChat = useServerFn(getDisputeChat);
  const sendMessage = useServerFn(sendDisputeMessage);
  const resolve = useServerFn(resolveDispute);
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const chatQuery = useQuery<DisputeChatData>({
    queryKey: ["dispute-chat", transactionId, user?.id],
    enabled: !!user,
    queryFn: () => getChat({ data: { transactionId } }),
    retry: false,
  });

  if (loading || !user) return null;

  const chat = chatQuery.data;
  const profileById = new Map((chat?.profiles ?? []).map((profile: any) => [profile.id, profile]));
  const participantName = (id: string) => {
    const profile = profileById.get(id) as any;
    if (id === chat?.transaction.buyer_id)
      return `${profile?.display_name ?? profile?.username ?? "Kupujący"} (kupujący)`;
    if (id === chat?.transaction.seller_id)
      return `${profile?.display_name ?? profile?.username ?? "Sprzedawca"} (sprzedawca)`;
    return `${profile?.display_name ?? profile?.username ?? "Administrator"} (admin)`;
  };

  const send = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await sendMessage({ data: { transactionId, content: trimmed } });
      setContent("");
      await chatQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message ?? "Nie udało się wysłać wiadomości");
    } finally {
      setSending(false);
    }
  };

  const decide = async (outcome: "release" | "refund") => {
    if (resolving || !chat?.isAdmin) return;
    setResolving(true);
    try {
      await resolve({ data: { transactionId, outcome, note: note.trim() || undefined } });
      toast.success(outcome === "release" ? "Środki zostały zwolnione." : "Zlecono zwrot środków.");
      await chatQuery.refetch();
      setNote("");
    } catch (error: any) {
      toast.error(error?.message ?? "Nie udało się rozstrzygnąć sporu");
    } finally {
      setResolving(false);
    }
  };

  if (chatQuery.isLoading) {
    return (
      <Page>
        <p className="text-muted-foreground">Ładowanie sporu...</p>
      </Page>
    );
  }

  if (chatQuery.error || !chat) {
    return (
      <Page>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5">
          <h1 className="font-display text-xl font-semibold">Nie udało się otworzyć sporu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wątek nie istnieje albo nie masz do niego dostępu.
          </p>
          <Link
            to="/notifications"
            className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Wróć do powiadomień
          </Link>
        </div>
      </Page>
    );
  }

  const closed =
    chat.thread.status === "closed" || !["held", "disputed"].includes(chat.transaction.status);

  return (
    <Page>
      <Link
        to="/notifications"
        className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/75 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Powiadomienia
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Spór transakcji
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">
            {chat.product?.title ?? "Produkt cyfrowy"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Uczestnicy: kupujący, sprzedawca i administrator. Status: {chat.transaction.status}.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${closed ? "border-border bg-muted text-muted-foreground" : "border-amber-500/40 bg-amber-500/10 text-amber-700"}`}
        >
          {closed ? "Zamknięty" : "Otwarty"}
        </span>
      </div>

      <div className="mt-6 rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Powód zgłoszenia</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/75">
          {chat.transaction.dispute_reason ?? "Brak opisu"}
        </p>
      </div>

      <div className="mt-6 min-h-[320px] max-h-[55vh] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-surface-elevated/50 p-4">
        {chat.messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Brak wiadomości w wątku.
          </p>
        )}
        {chat.messages.map((message: any) => {
          const mine = message.sender_id === user.id;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${mine ? "bg-gradient-primary text-primary-foreground" : "bg-card border border-border/60"}`}
              >
                <p
                  className={`mb-1 text-xs font-semibold ${mine ? "text-primary-foreground/80" : "text-primary"}`}
                >
                  {mine ? "Ty" : participantName(message.sender_id)}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`mt-2 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {new Date(message.created_at).toLocaleString("pl-PL")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!closed && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Napisz wiadomość do uczestników sporu..."
            className="min-h-[72px]"
          />
          <Button
            type="submit"
            disabled={sending || !content.trim()}
            className="self-end bg-gradient-primary text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      {chat.isAdmin && !closed && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 text-primary" /> Panel administratora
          </div>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Komentarz do rozstrzygnięcia (opcjonalnie)"
            className="mt-3"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={resolving}
              onClick={() => void decide("release")}
              className="bg-success text-success-foreground"
            >
              <CheckCircle2 className="h-4 w-4" /> Zwolnij środki
            </Button>
            <Button
              type="button"
              disabled={resolving}
              variant="destructive"
              onClick={() => void decide("refund")}
            >
              <XCircle className="h-4 w-4" /> Zwróć kupującemu
            </Button>
          </div>
        </div>
      )}
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto w-full max-w-4xl flex-1 px-4 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
