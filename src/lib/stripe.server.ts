import Stripe from "stripe";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

// Zachowane dla zgodności z istniejącymi wywołaniami (sandbox = klucz testowy,
// live = klucz produkcyjny). Środowisko wynika teraz wprost z Twojego
// STRIPE_SECRET_KEY (sk_test_... vs sk_live_...).
export type StripeEnv = "sandbox" | "live";

export function getSecretKey(): string {
  return getEnv("STRIPE_SECRET_KEY");
}

export function getServerStripeEnv(): StripeEnv {
  return getSecretKey().startsWith("sk_live_") ? "live" : "sandbox";
}

/** Bezpośredni klient Stripe API — bez gatewaya Lovable. */
export function createStripeClient(_env?: StripeEnv): Stripe {
  return new Stripe(getSecretKey(), {
    apiVersion: "2026-03-25.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as any;
    const message = e.raw?.message ?? e.message;
    if (message) {
      const details = [
        e.raw?.type ?? e.type,
        e.raw?.code ?? e.code,
        e.raw?.decline_code ?? e.decline_code,
        e.raw?.param ?? e.param,
        e.raw?.requestId ?? e.requestId,
      ].filter(Boolean);
      return details.length ? `${message} (${details.join(", ")})` : message;
    }
  }
  return "Stripe request failed";
}

export async function verifyWebhook(
  req: Request,
  _env?: StripeEnv,
): Promise<{ type: string; data: { object: any } }> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret = getEnv("STRIPE_WEBHOOK_SECRET");

  if (!signature || !body) throw new Error("Missing signature or body");

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1") v1Signatures.push(value);
  }
  if (!timestamp || v1Signatures.length === 0) throw new Error("Invalid signature format");

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) throw new Error("Webhook timestamp too old");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const expected = Buffer.from(new Uint8Array(signed)).toString("hex");

  if (!v1Signatures.includes(expected)) throw new Error("Invalid webhook signature");

  return JSON.parse(body);
}
