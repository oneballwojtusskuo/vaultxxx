import { Link } from "@tanstack/react-router";
import { openCookieSettings } from "@/components/cookie-banner";
import { OPERATOR_CONTACT } from "@/lib/operator";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 mt-24">
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground/75">
              © {new Date().getFullYear()} <span className="font-semibold text-foreground">vlnd</span> — marketplace cyfrowy
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/help"
              className="text-xs text-foreground/75 hover:text-foreground transition-colors"
            >
              Centrum pomocy
            </Link>
            <Link
              to="/regulamin"
              className="text-xs text-foreground/75 hover:text-foreground transition-colors"
            >
              Regulamin
            </Link>
            <Link
              to="/polityka-prywatnosci"
              className="text-xs text-foreground/75 hover:text-foreground transition-colors"
            >
              Polityka prywatności
            </Link>
            <Link
              to="/moje-dane"
              className="text-xs text-foreground/75 hover:text-foreground transition-colors"
            >
              Moje dane (RODO)
            </Link>
            <a
              href={`mailto:${OPERATOR_CONTACT}`}
              className="text-xs text-foreground/75 hover:text-foreground transition-colors"
            >
              Kontakt
            </a>
            <Button
              type="button"
              variant="link"
              onClick={openCookieSettings}
              className="h-auto p-0 text-xs font-normal text-foreground/75 hover:text-foreground transition-colors"
            >
              Ustawienia cookies
            </Button>
            <Link
              to="/report-infringement"
              className="text-xs text-foreground/75 hover:text-foreground transition-colors"
            >
              Zgłoś naruszenie praw autorskich
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
