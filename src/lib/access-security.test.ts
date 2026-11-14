import { describe, expect, it } from "vitest";
import { isSellerFile, trustedAppOrigin } from "./access-security";

describe("private file and return URL boundaries", () => {
  it("allows only the seller's own non-traversing file path", () => {
    expect(isSellerFile("seller/book.pdf", "seller")).toBe(true);
    for (const path of ["other/book.pdf", "seller/../other.pdf", "seller/%2e%2e/other.pdf", "seller/", "seller/\\other.pdf"]) expect(isSellerFile(path, "seller")).toBe(false);
  });
  it("rejects external Stripe return origins", () => {
    expect(trustedAppOrigin("https://vlnd.pl/sell")).toBe("https://vlnd.pl");
    expect(trustedAppOrigin("https://evil.example/sell")).toBe("https://vlnd.pl");
    expect(trustedAppOrigin("https://vlnd.pl.evil.example")).toBe("https://vlnd.pl");
    expect(trustedAppOrigin("http://localhost:8080/sell")).toBe("http://localhost:8080");
  });
});