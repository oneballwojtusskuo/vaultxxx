import { useState } from "react";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const REASONS = [
  "Oszustwo / scam",
  "Naruszenie praw autorskich",
  "Treści nielegalne",
  "Spam / wprowadzanie w błąd",
  "Złośliwe oprogramowanie",
  "Inne",
];

interface Props {
  targetType: "product" | "user";
  targetId: string;
}

export function ReportDialog({ targetType, targetId }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Zaloguj się, aby zgłosić");
    if (!reason) return toast.error("Wybierz powód");
    setLoading(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      description: description.trim() || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Zgłoszenie wysłane. Dziękujemy!");
    setOpen(false);
    setReason("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Flag className="h-4 w-4 mr-1.5" /> Zgłoś
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zgłoś {targetType === "product" ? "produkt" : "użytkownika"}</DialogTitle>
          <DialogDescription>
            Pomagasz nam utrzymać marketplace bezpiecznym. Każde zgłoszenie jest weryfikowane.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Wybierz powód" /></SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Opisz problem (opcjonalnie)"
            value={description}
            maxLength={1000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading} className="bg-gradient-primary text-primary-foreground">
            Wyślij zgłoszenie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
