const publishableKey =
  (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined) ||
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined);

export function PaymentTestModeBanner() {
  if (!publishableKey) {
    return (
      <div className="w-full bg-destructive/15 border-b border-destructive/40 px-4 py-2 text-center text-xs text-destructive">
        Płatności nie są jeszcze skonfigurowane — zakupy są chwilowo wyłączone.
      </div>
    );
  }
  if (publishableKey.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-accent/15 border-b border-accent/40 px-4 py-2 text-center text-xs text-accent-foreground">
        Tryb testowy płatności — wszystkie transakcje są testowe. BLIK w sandbox: kod{" "}
        <span className="font-mono font-semibold">777123</span>, karta testowa{" "}
        <span className="font-mono">4242 4242 4242 4242</span>.
      </div>
    );
  }
  return null;
}
