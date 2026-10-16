import { describe, it, expect } from "vitest";
import { buyerPriceOf, buyerFeeOf, minBuyerPriceOf } from "./pricing";

describe("buyer total", () => {
  it("BLIK: 100 PLN -> 112.80 PLN", () => expect(buyerPriceOf(100, "blik")).toBe(112.8));
  it("BLIK fee for 100 PLN is 12.80", () => expect(buyerFeeOf(100, "blik")).toBe(12.8));
  it("card: 100 PLN -> 113.15 PLN", () => expect(buyerPriceOf(100, "card")).toBe(113.15));
  it("P24: 100 PLN -> 113.15 PLN", () => expect(buyerPriceOf(100, "p24")).toBe(113.15));
  it("cheapest shown on listings is BLIK", () => expect(minBuyerPriceOf(100)).toBe(112.8));
  it("free stays free", () => expect(buyerPriceOf(0, "card")).toBe(0));
});
