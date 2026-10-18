import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Notifies the site owner once when a user finishes signup (username set). */
export const notifyAdminSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data: profile } = await context.supabase
        .from("profiles" as any)
        .select("username")
        .eq("id", context.userId)
        .maybeSingle();
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("admin-alert", "wojciechjudek04@gmail.com", {
        templateData: {
          kind: "signup",
          username: (profile as any)?.username ?? null,
          email: (context.claims as any)?.email ?? null,
        },
        idempotencyKey: `admin-signup-${context.userId}`,
      });
    } catch (e) {
      console.error("Admin signup email failed", e);
    }
    return { ok: true };
  });
