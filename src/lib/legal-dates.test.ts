import { describe, expect, it } from "vitest";
import { SERVICE_LAUNCH_DATE, LEGAL_REVISION_DATE } from "./legal-dates";

describe("legal document dates", () => {
  it("uses the launch date confirmed by the operator: 6 November 2026", () => {
    expect(SERVICE_LAUNCH_DATE).toBe("2026-11-06");
  });
  it("keeps the 15 November revision separate from launch", () => {
    expect(LEGAL_REVISION_DATE).toBe("2026-11-15");
    expect(Date.parse(LEGAL_REVISION_DATE)).toBeGreaterThan(Date.parse(SERVICE_LAUNCH_DATE));
  });
});