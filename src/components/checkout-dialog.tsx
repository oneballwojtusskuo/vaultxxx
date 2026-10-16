import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStripe } from "@/lib/stripe";
import { buyerPriceOf, formatPrice, PAYMENT_FEES, type PaymentMethod } from "@/lib/pricing";

export function CheckoutDialog({
  clientSecret,
  open,
  onOpenChange,
  sellerPrice,
  currency = "PLN",
  paymentMethod = "blik",
}: {
  clientSecret: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sellerPrice?: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
}) {
  const hasPrice = typeof sellerPrice === "number" && sellerPrice > 0;
  const total = hasPrice ? buyerPriceOf(sellerPrice, paymentMethod) : 0;
  const fee = hasPrice ? +(total - sellerPrice).toFixed(2) : 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Płatność — {PAYMENT_FEES[paymentMethod].label}</DialogTitle>
        </DialogHeader>
        {hasPrice && (
          <div className="mx-6 mt-2 rounded-xl border border-border/60 bg-card p-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cena produktu</span>
              <span>{formatPrice(sellerPrice, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Opłata serwisowa i realizacja płatności</span>
              <span>{formatPrice(fee, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-2 font-semibold">
              <span>Łącznie do zapłaty</span>
              <span>{formatPrice(total, currency)}</span>
            </div>
          </div>
        )}
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
