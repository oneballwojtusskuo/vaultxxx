import { describe, expect, it } from "vitest";
import { getPriceReduction } from "./price-reductions";

const history = {
  price_history_started_at: "2026-11-17T18:00:00Z",
  reduction_reference_since: "2026-11-17T18:00:00Z",
};

describe("product price reductions", () => {
  it("shows the old price after a reduction", () => {
    expect(getPriceReduction({ ...history, price: 20, previous_price: 30, lowest_price_before_reduction: 30 }))
      .toMatchObject({ previous: 30, lowest: 30 });
  });
  it("does not show a promotion for unchanged or increased prices", () => {
    expect(getPriceReduction({ ...history, price: 30, previous_price: 30, lowest_price_before_reduction: 30 })).toBeNull();
    expect(getPriceReduction({ ...history, price: 40, previous_price: 30, lowest_price_before_reduction: 30 })).toBeNull();
  });
  it("preserves the lowest reference after successive reductions", () => {
    expect(getPriceReduction({ ...history, price: 10, previous_price: 20, lowest_price_before_reduction: 20 }))
      .toMatchObject({ previous: 20, lowest: 20 });
  });
  it("does not call a reduction from an inflated price a promotion", () => {
    expect(getPriceReduction({ ...history, price: 25, previous_price: 50, lowest_price_before_reduction: 20 })).toBeNull();
  });
  it("does not invent a reference when history is missing", () => {
    expect(getPriceReduction({ price: 20, previous_price: 30 })).toBeNull();
  });
  it("supports reductions to free", () => {
    expect(getPriceReduction({ ...history, price: 0, previous_price: 20, lowest_price_before_reduction: 20 }))
      .toMatchObject({ previous: 20, lowest: 20 });
  });
});