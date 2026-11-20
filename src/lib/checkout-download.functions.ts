import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PAID = ["held", "released", "completed", "disputed"];

/** After returning from Stripe, the checkout session id (unguessable) proves the purchase; returns a direct download link once paid. */
export const getCheckoutDownload = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ sessionId: z.string().regex(/^cs_(test|live)_[A-Za-z0-9]{10,200}$/) }).parse(i))
  .handler(async ({ data }) => {
    const secret = process.env.DOWNLOAD_LINK_SECRET;
    if (!secret) return { status: "error" as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tx } = await supabaseAdmin.from("transactions").select("id, status")
      .eq("stripe_session_id", data.sessionId).maybeSingle();
    if (!tx) return { status: "unknown" as const };
    if (!PAID.includes(tx.status)) return { status: "pending" as const };
    const { createDownloadToken } = await import("@/lib/download-token");
    return { status: "ready" as const, url: `/api/public/download?t=${encodeURIComponent(await createDownloadToken(secret, tx.id))}` };
  });
