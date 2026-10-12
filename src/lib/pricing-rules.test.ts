import { describe, it, expect } from "vitest";
import { validatePrice, PRICE_ERROR } from "./pricing-rules";

describe("validatePrice", () => {
  it("allows free products (0 PLN)", () => expect(validatePrice("0")).toBeNull());
  it("rejects 0.50 PLN", () => expect(validatePrice("0.50")).toBe(PRICE_ERROR));
  it("rejects 1.99 PLN", () => expect(validatePrice(1.99)).toBe(PRICE_ERROR));
  it("allows 2.00 PLN", () => expect(validatePrice("2.00")).toBeNull());
  it("rejects negative prices", () => expect(validatePrice(-1)).not.toBeNull());
});
