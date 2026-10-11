import { Link } from "@tanstack/react-router";
import { openCookieSettings } from "@/components/cookie-banner";
import {
  OPERATOR_NAME,
  OPERATOR_NIP,
  OPERATOR_ADDRESS,
  OPERATOR_CONTACT,
} from "@/lib/operator";

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
            <button
              type="button"
              onClick={openCookieSettings}
              className="text-xs text-foreground/75 hover:text-foreground transition-colors"
            >
              Ustawienia cookies
            </button>
            <Link
              to="/report-infringement"
              className="text-xs text-foreground/75 hover:text-foreground transition-colors"
            >
              Zgłoś naruszenie praw autorskich
            </Link>
          </div>
        </div>

        <details className="group rounded-xl border border-border/40 bg-background/40 text-xs text-foreground/75">
          <summary className="cursor-pointer list-none p-4 font-semibold text-foreground group-open:border-b group-open:border-border/40">
            Operator serwisu i Administrator Danych Osobowych
          </summary>
          <div className="space-y-3 p-4">
            <p>
              <span className="font-semibold text-foreground">Operator serwisu:</span>
              <br />
              {OPERATOR_NAME}
              <br />
              {OPERATOR_ADDRESS} | NIP: {OPERATOR_NIP}
              <br />
              Kontakt / Punkt kontaktowy DSA:{" "}
              <a
                href={`mailto:${OPERATOR_CONTACT}`}
                className="font-medium text-primary hover:underline"
              >
                {OPERATOR_CONTACT}
              </a>
            </p>
            <p>
              vlnd.pl jest platformą pośredniczącą — sprzedawcą treści cyfrowych jest użytkownik
              wystawiający produkt. Płatności obsługuje Stripe. Serwis jest przeznaczony dla osób
              od 13 roku życia (osoby w wieku 13–17 lat za zgodą rodzica).
            </p>
          </div>
        </details>
      </div>
    </footer>
  );
}
