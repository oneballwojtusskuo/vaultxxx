import { describe, expect, it } from "vitest";
import { LEGAL_DISPUTE_POLICY } from "./legal-dispute-policy";

describe("operator dispute terms", () => {
  it("requires resolution within 7 business days", () => {
    expect(LEGAL_DISPUTE_POLICY.resolutionBusinessDays).toBe(7);
  });

  it("imposes no contractual monetary penalty", () => {
    expect(LEGAL_DISPUTE_POLICY.contractualPenaltyPln).toBe(0);
  });
});