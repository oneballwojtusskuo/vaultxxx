import { describe, it, expect } from "vitest";
import { buyerPriceOf, buyerFeeOf } from "./pricing";

describe("buyer total", () => {
  it("100 PLN -> 112.80 PLN", () => expect(buyerPriceOf(100)).toBe(112.8));
  it("fee for 100 PLN is 12.80", () => expect(buyerFeeOf(100)).toBe(12.8));
  it("free stays free", () => expect(buyerPriceOf(0)).toBe(0));
});
