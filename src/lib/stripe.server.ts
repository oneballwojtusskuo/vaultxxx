import Stripe from "stripe";
import { timingSafeEqual } from "node:crypto";
import { StripeEventSchema, validWebhookTimestamp } from "@/lib/webhook-security";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export type StripeEnv = "sandbox" | "live";

const GATEWAY_STRIPE_BASE = "https://connector-gateway.lovable.dev/stripe";

/** Klucze pochodzą z integracji płatności Lovable (sandbox/live). */
export function getSecretKey(env: StripeEnv): string {
  return getEnv(env === "live" ? "STRIPE_LIVE_API_KEY" : "STRIPE_SANDBOX_API_KEY");
}

export function getServerStripeEnv(): StripeEnv {
  return process.env["STRIPE_LIVE_API_KEY"] ? "live" : "sandbox";
}

export function createStripeClient(env: StripeEnv): Stripe {
  const key = getSecretKey(env);
  const lovableApiKey = getEnv("LOVABLE_API_KEY");
  return new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
    httpClient: Stripe.createFetchHttpClient((input, init) => {
      const stripeUrl = input instanceof Request ? input.url : input.toString();
      const gatewayUrl = stripeUrl.replace("https://api.stripe.com", GATEWAY_STRIPE_BASE);
      return fetch(gatewayUrl, {
        ...init,
        headers: {
          ...Object.fromEntries(
            new Headers(
              init?.headers ?? (input instanceof Request ? input.headers : undefined),
            ).entries(),
          ),
          "X-Connection-Api-Key": key,
          "Lovable-API-Key": lovableApiKey,
        },
      });
    }),
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
  env: StripeEnv,
): Promise<{ id: string; type: string; livemode: boolean; data: { object: any } }> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const managedSecret =
    env === "live"
      ? process.env["PAYMENTS_LIVE_WEBHOOK_SECRET"]
      : process.env["PAYMENTS_SANDBOX_WEBHOOK_SECRET"];
  if (!managedSecret) throw new Error("Webhook secret is not configured for this environment");
  const secret = managedSecret;

  if (!signature || !body) throw new Error("Missing signature or body");

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1") v1Signatures.push(value);
  }
  if (!timestamp || v1Signatures.length === 0) throw new Error("Invalid signature format");

  if (!validWebhookTimestamp(timestamp, Date.now() / 1000)) throw new Error("Invalid webhook timestamp");

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

  const valid = v1Signatures.some((value) => /^[a-f0-9]{64}$/i.test(value)
    && timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(expected, "hex")));
  if (!valid) throw new Error("Invalid webhook signature");

  const event = StripeEventSchema.parse(JSON.parse(body));
  if (event.livemode !== (env === "live")) throw new Error("Wrong webhook environment");
  return event;
}
