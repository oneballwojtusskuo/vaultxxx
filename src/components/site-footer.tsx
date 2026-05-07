import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 mt-24">
      <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} VaultX — marketplace cyfrowy</span>
        </div>
        <p className="text-xs text-muted-foreground">Kupuj. Sprzedawaj. Wymieniaj.</p>
      </div>
    </footer>
  );
}
