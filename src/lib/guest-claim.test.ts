import { describe, expect, it } from "vitest";
import { canClaimGuestAccount, hashClaimToken } from "./guest-claim";

describe("guest account claim", () => {
  it("allows the matching token on a never-used guest account", async () => {
    const h = await hashClaimToken("abc");
    expect(canClaimGuestAccount({ app_metadata: { guest_claim_hash: h }, last_sign_in_at: null }, h)).toBe(true);
  });
  it("rejects a wrong token", async () => {
    const h = await hashClaimToken("abc");
    expect(canClaimGuestAccount({ app_metadata: { guest_claim_hash: h } }, await hashClaimToken("x"))).toBe(false);
  });
  it("rejects accounts that were already signed into", async () => {
    const h = await hashClaimToken("abc");
    expect(canClaimGuestAccount({ app_metadata: { guest_claim_hash: h }, last_sign_in_at: "2026-11-17" }, h)).toBe(false);
  });
  it("rejects existing accounts without a claim token", async () => {
    expect(canClaimGuestAccount({ app_metadata: {} }, await hashClaimToken("abc"))).toBe(false);
  });
});
