import { z } from "zod";

export const StripeEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  livemode: z.boolean(),
  data: z.object({ object: z.record(z.unknown()) }),
});

export function validWebhookTimestamp(timestamp: string, nowSeconds: number) {
  if (!/^\d+$/.test(timestamp)) return false;
  const seconds = Number(timestamp);
  return Number.isSafeInteger(seconds) && Math.abs(nowSeconds - seconds) <= 300;
}

export function matchesPayment(
  tx: { amount: number | string; currency: string; stripe_env: string | null },
  amount: unknown,
  currency: unknown,
  env: "sandbox" | "live",
) {
  return tx.stripe_env === env && typeof amount === "number" && Number.isSafeInteger(amount)
    && amount > 0 && amount === Math.round(Number(tx.amount) * 100)
    && typeof currency === "string" && currency.toLowerCase() === tx.currency.toLowerCase();
}