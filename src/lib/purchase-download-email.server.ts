interface PurchaseDownloadEmailInput {
  transactionId: string;
  buyerId: string | null;
  productId: string | null;
  isFree?: boolean;
}

/** Sends the transaction-specific, login-free download link without blocking fulfillment. */
export async function sendPurchaseDownloadEmail({
  transactionId,
  buyerId,
  productId,
  isFree = false,
}: PurchaseDownloadEmailInput): Promise<boolean> {
  try {
    const secret = process.env["DOWNLOAD_LINK_SECRET"];
    if (!secret || !buyerId) return false;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(buyerId);
    const email = u?.user?.email;
    if (!email) return false;

    const { data: product } = productId
      ? await supabaseAdmin.from("products").select("title").eq("id", productId).maybeSingle()
      : { data: null };
    const { createDownloadToken } = await import("@/lib/download-token");
    const token = await createDownloadToken(secret, transactionId);
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail("purchase-download", email, {
      templateData: {
        productTitle: product?.title ?? undefined,
        downloadUrl: `https://vlnd.pl/api/public/download?t=${token}`,
        isFree,
      },
      idempotencyKey: `purchase-download-${transactionId}`,
    });
    return result.sent;
  } catch (error) {
    console.error("Download email failed:", error);
    return false;
  }
}
