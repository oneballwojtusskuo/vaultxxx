import { describe, expect, it, vi } from "vitest";
import { requestGuestLoginLink, shouldDeferOnboardingForBuyer } from "./guest-checkout";

describe("guest checkout access", () => {
  it("creates an account automatically instead of requiring manual registration", async () => {
    const auth = { signInWithOtp: vi.fn().mockResolvedValue({ error: null }) };

    await requestGuestLoginLink(auth, "kupujacy@example.com", "https://vlnd.pl", "/product/ebook");

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "kupujacy@example.com",
      options: {
        emailRedirectTo: "https://vlnd.pl/product/ebook?buy=1",
        shouldCreateUser: true,
        data: { age_consent_accepted: true, passwordless_checkout: "true" },
      },
    });
  });

  it("returns the verified buyer to the same product to finish the purchase", async () => {
    const auth = { signInWithOtp: vi.fn().mockResolvedValue({ error: null }) };

    await requestGuestLoginLink(
      auth,
      "kupujacy@example.com",
      "https://vlnd.pl",
      "/product/mechanizm-przyciagnia-kobiet",
    );

    const credentials = auth.signInWithOtp.mock.calls[0][0];
    expect(credentials.options.emailRedirectTo).toBe(
      "https://vlnd.pl/product/mechanizm-przyciagnia-kobiet?buy=1",
    );
  });

  it("does not force a passwordless buyer through profile setup before purchasing", () => {
    expect(
      shouldDeferOnboardingForBuyer(
        { passwordless_checkout: "true" },
        "/product/mechanizm-przyciagnia-kobiet",
      ),
    ).toBe(true);
  });

  it("still requires a creator profile when the same user starts selling", () => {
    expect(shouldDeferOnboardingForBuyer({ passwordless_checkout: "true" }, "/sell")).toBe(false);
    expect(shouldDeferOnboardingForBuyer({}, "/product/ebook")).toBe(false);
  });
});
