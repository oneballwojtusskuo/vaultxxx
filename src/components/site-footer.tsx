import { Link } from "@tanstack/react-router";
import { VlndLogo } from "@/components/vlnd-logo";
import { openCookieSettings } from "@/components/cookie-banner";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 mt-24">
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary p-0.5">
              <VlndLogo className="h-full w-full" />
            </div>
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} vlnd — marketplace cyfrowy</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/help" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Centrum pomocy
            </Link>
            <Link to="/regulamin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Regulamin
            </Link>
            <Link to="/polityka-prywatnosci" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Polityka prywatności
            </Link>
            <Link to="/moje-dane" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Moje dane (RODO)
            </Link>
            <button
              type="button"
              onClick={openCookieSettings}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ustawienia cookies
            </button>
            <Link to="/report-infringement" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Zgłoś naruszenie praw autorskich
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-background/40 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Operator serwisu i Administrator Danych Osobowych</p>
          <p>
            {OPERATOR_NAME}, {OPERATOR_LEGAL_FORM}. Adres do korespondencji: {OPERATOR_ADDRESS}. Kontakt e-mail:{" "}
            <a href={`mailto:${OPERATOR_CONTACT}`} className="text-accent hover:underline">
              {OPERATOR_CONTACT}
            </a>
            . Punkt kontaktowy w rozumieniu aktu o usługach cyfrowych (DSA) oraz sprawy danych osobowych: ten sam adres e-mail.
          </p>
          <p>{OPERATOR_FOOTER_LINE}</p>
          <p>
            Serwis jest platformą pośredniczącą — sprzedawcą treści cyfrowej jest użytkownik wystawiający produkt.
            Płatności obsługuje Stripe. Serwis przeznaczony dla osób, które ukończyły 16 lat.
          </p>
        </div>
      </div>
    </footer>
  );
}
