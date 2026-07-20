import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ShieldAlert, Clock } from "lucide-react";
import { toast } from "sonner";
import { confirmDelivery, disputeDelivery } from "@/lib/escrow.functions";

interface Props {
  transactionId: string;
  status: string;
  onChanged?: () => void;
}

export function EscrowActions({ transactionId, status, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const confirmFn = useServerFn(confirmDelivery);
  const disputeFn = useServerFn(disputeDelivery);

  if (status === "released" || status === "completed") {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-emerald-500">
        <CheckCircle2 className="h-4 w-4" />
        Transakcja zamknięta — środki wypłacone sprzedawcy.
      </div>
    );
  }

  if (status === "disputed") {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-amber-500">
        <ShieldAlert className="h-4 w-4" />
        Zgłoszono problem — środki pozostają w depozycie do rozstrzygnięcia.
      </div>
    );
  }

  if (status !== "held") return null;

  const doConfirm = async () => {
    setLoading(true);
    try {
      await confirmFn({ data: { transactionId } });
      toast.success("Dziękujemy! Środki zostały zwolnione do sprzedawcy.");
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się potwierdzić");
    } finally {
      setLoading(false);
    }
  };

  const doDispute = async () => {
    if (reason.trim().length < 10) {
      toast.error("Opisz problem (min. 10 znaków)");
      return;
    }
    setLoading(true);
    try {
      await disputeFn({ data: { transactionId, reason: reason.trim() } });
      toast.success("Zgłoszenie wysłane. Środki pozostają w depozycie.");
      setDisputeOpen(false);
      setReason("");
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się zgłosić");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4 text-accent" />
        Środki w depozycie
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Sprawdź plik. Kiedy wszystko będzie w porządku, potwierdź odbiór — dopiero wtedy sprzedawca dostanie pieniądze.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={doConfirm} disabled={loading} className="bg-gradient-primary text-primary-foreground">
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          Potwierdź odbiór i zwolnij środki
        </Button>
        <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={loading}>
              <ShieldAlert className="h-4 w-4 mr-1.5" />
              Zgłoś problem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zgłoś problem z transakcją</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Opisz co jest nie tak z otrzymanym plikiem (min. 10 znaków)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDisputeOpen(false)} disabled={loading}>Anuluj</Button>
              <Button onClick={doDispute} disabled={loading}>Wyślij zgłoszenie</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
