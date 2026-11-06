import { describe, expect, it } from "vitest";
import { LAUNCH_CREATOR_LIMIT, launchSpotsRemaining } from "./launch";

describe("first creators launch offer", () => {
  it("offers exactly 30 places before anyone qualifies", () => {
    expect(LAUNCH_CREATOR_LIMIT).toBe(30);
    expect(launchSpotsRemaining(0)).toBe(30);
  });

  it("subtracts each awarded creator once", () => {
    expect(launchSpotsRemaining(2)).toBe(28);
    expect(launchSpotsRemaining(29)).toBe(1);
  });

  it("never shows available places after all 30 are awarded", () => {
    expect(launchSpotsRemaining(30)).toBe(0);
    expect(launchSpotsRemaining(31)).toBe(0);
  });
});
