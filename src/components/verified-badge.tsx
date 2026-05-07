import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-medium ${className}`}>
          <ShieldCheck className="h-3 w-3" />
          Zweryfikowany
        </span>
      </TooltipTrigger>
      <TooltipContent>Sprzedawca zweryfikowany przez VaultX</TooltipContent>
    </Tooltip>
  );
}
