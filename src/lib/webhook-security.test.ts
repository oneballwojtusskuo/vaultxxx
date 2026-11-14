import { describe, expect, it } from "vitest";
import { matchesPayment, validWebhookTimestamp, StripeEventSchema } from "./webhook-security";

describe("Stripe payment security", () => {
  it("rejects missing, nonnumeric, stale and future timestamps", () => {
    for (const t of ["", "NaN", "Infinity", "999", "1601"]) expect(validWebhookTimestamp(t, 1300)).toBe(false);
    expect(validWebhookTimestamp("1300", 1300)).toBe(true);
  });
  it("requires exact paid amount, currency and payment environment", () => {
    const tx = { amount: 113.15, currency: "PLN", stripe_env: "live" };
    expect(matchesPayment(tx, 11315, "pln", "live")).toBe(true);
    expect(matchesPayment(tx, 0, "pln", "live")).toBe(false);
    expect(matchesPayment(tx, 11314, "pln", "live")).toBe(false);
    expect(matchesPayment(tx, 11315, "eur", "live")).toBe(false);
    expect(matchesPayment(tx, 11315, "pln", "sandbox")).toBe(false);
  });
  it("requires a structured event with its mode", () => {
    expect(StripeEventSchema.safeParse({ type: "payment_intent.succeeded", data: { object: {} } }).success).toBe(false);
  });
});