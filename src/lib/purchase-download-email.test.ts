import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserById: vi.fn(),
  maybeSingle: vi.fn(),
  createDownloadToken: vi.fn(),
  sendTemplateEmail: vi.fn(),
}));

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    auth: { admin: { getUserById: mocks.getUserById } },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  },
}));
vi.mock("@/lib/download-token", () => ({ createDownloadToken: mocks.createDownloadToken }));
vi.mock("@/lib/email-templates/send-email", () => ({ sendTemplateEmail: mocks.sendTemplateEmail }));

import { sendPurchaseDownloadEmail } from "./purchase-download-email.server";

describe("free purchase download email", () => {
  beforeEach(() => {
    vi.stubEnv("DOWNLOAD_LINK_SECRET", "test-secret");
    mocks.getUserById.mockResolvedValue({ data: { user: { email: "buyer@example.com" } } });
    mocks.maybeSingle.mockResolvedValue({ data: { title: "Darmowy planer" } });
    mocks.createDownloadToken.mockResolvedValue("signed-transaction-token");
    mocks.sendTemplateEmail.mockResolvedValue({ sent: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("sends a free buyer the link signed for their exact transaction", async () => {
    const sent = await sendPurchaseDownloadEmail({
      transactionId: "c0cb72ed-8c7a-438b-a0fd-858ee376471c",
      buyerId: "d5250fa4-90e6-403e-9541-664865aeaaeb",
      productId: "2dca51b6-649e-4e9e-a787-cb838e7fc800",
      isFree: true,
    });

    expect(sent).toBe(true);
    expect(mocks.createDownloadToken).toHaveBeenCalledWith(
      "test-secret",
      "c0cb72ed-8c7a-438b-a0fd-858ee376471c",
    );
    expect(mocks.sendTemplateEmail).toHaveBeenCalledWith("purchase-download", "buyer@example.com", {
      templateData: {
        productTitle: "Darmowy planer",
        downloadUrl: "https://vlnd.pl/api/public/download?t=signed-transaction-token",
        isFree: true,
      },
      idempotencyKey: "purchase-download-c0cb72ed-8c7a-438b-a0fd-858ee376471c",
    });
  });
});
