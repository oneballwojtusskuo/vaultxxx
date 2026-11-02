import { describe, expect, it } from "vitest";
import { isProductId, productShareUrl, productUrlKey } from "./product-links";

describe("clean product links", () => {
  const id = "5a1e4d4f-ec90-4d0b-9bba-873734f2d126";
  it("shares the title-based address on the primary domain without tracking parameters", () => {
    expect(productShareUrl({ id, slug: "biznes-planner" })).toBe("https://vlnd.pl/product/biznes-planner");
  });
  it("preserves the legacy identifier when a slug is unavailable", () => {
    expect(productUrlKey({ id })).toBe(id);
    expect(isProductId(id)).toBe(true);
    expect(isProductId("biznes-planner")).toBe(false);
  });
});