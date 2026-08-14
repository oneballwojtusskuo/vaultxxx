import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type StripeEnv = "sandbox" | "live";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

function paymentsEnvironment(): StripeEnv {
  if (publishableKey?.startsWith("pk_test_")) return "sandbox";
  if (publishableKey?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Brak klucza VITE_STRIPE_PUBLISHABLE_KEY. Dodaj swój klucz publiczny Stripe do zmiennych środowiskowych.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(publishableKey as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}
