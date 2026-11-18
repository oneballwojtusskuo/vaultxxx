import { createFileRoute } from "@tanstack/react-router";

/**
 * Hourly escrow sweep (called by the database scheduler).
 * Safe without auth: it only releases transactions whose 24h escrow already
 * expired and pays out sellers for already-released sales. Idempotent; returns counts only.
 */
export const Route = createFileRoute("/api/public/escrow/process")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: released, error } = await supabaseAdmin.rpc("release_expired_escrow" as any);
        if (error) {
          console.error("release_expired_escrow failed", error);
          return Response.json({ ok: false }, { status: 500 });
        }
        const { processPendingSellerPayouts } = await import("@/lib/connect.server");
        await processPendingSellerPayouts(supabaseAdmin as any);
        return Response.json({ ok: true, released: Number(released ?? 0) });
      },
    },
  },
});
