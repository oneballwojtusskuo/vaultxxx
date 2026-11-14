import { describe, expect, it } from "vitest";
import { assertListingOwner, assertListingFiles, needsListingReview, listingEditSchema } from "./listing-edit";

describe("own listing edits", () => {
  it("rejects editing another seller's listing", () => {
    expect(() => assertListingOwner("seller", "other")).toThrow();
    expect(() => assertListingOwner("seller", "seller")).not.toThrow();
  });
  it("rejects foreign or traversing replacement files", () => {
    expect(() => assertListingFiles(["other/book.pdf"], "seller")).toThrow();
    expect(() => assertListingFiles(["seller/../book.pdf"], "seller")).toThrow();
    expect(() => assertListingFiles(["seller/book.pdf"], "seller")).not.toThrow();
  });
  it("allows price changes without re-review but re-reviews content changes", () => {
    expect(needsListingReview({ price: 10, title: "Book" }, { price: 20, title: "Book" })).toBe(false);
    expect(needsListingReview({ title: "Book" }, { title: "New book" })).toBe(true);
    expect(needsListingReview({ file_paths: ["seller/old.pdf"] }, { file_paths: ["seller/new.pdf"] })).toBe(true);
  });
  it("does not accept protected status or ownership fields", () => {
    expect(listingEditSchema.shape.price.safeParse(1).success).toBe(false);
    expect(listingEditSchema.shape.price.safeParse(20).success).toBe(true);
    expect(listingEditSchema.shape.affiliate_commission_pct.safeParse(51).success).toBe(false);
    expect(Object.keys(listingEditSchema.shape)).not.toContain("status");
    expect(Object.keys(listingEditSchema.shape)).not.toContain("seller_id");
    expect(Object.keys(listingEditSchema.shape)).not.toContain("slug");
  });
});