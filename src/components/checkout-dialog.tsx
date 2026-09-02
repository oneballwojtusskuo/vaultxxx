import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStripe } from "@/lib/stripe";

export function CheckoutDialog({
  clientSecret,
  open,
  onOpenChange,
}: {
  clientSecret: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Płatność — wybierz BLIK, kartę lub Przelewy24</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {clientSecret ? (
            <EmbeddedCheckoutProvider
              stripe={getStripe()}
              options={{ fetchClientSecret: async () => clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-10">
              Ładuję formularz płatności…
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
