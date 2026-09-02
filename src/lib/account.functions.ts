import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EmailSchema = z.object({ email: z.string().trim().email().max(255) });

/**
 * Checks whether an account already exists for the given e-mail so the sign-up
 * form can redirect the visitor to the login tab instead of failing later.
 */
export const emailAlreadyRegistered = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: found } = await supabaseAdmin.from("profiles").select("id").limit(1);
    // profiles has no e-mail column — use the auth admin API.
    void found;
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) return { exists: false };
    const target = data.email.toLowerCase();
    return { exists: (users?.users ?? []).some((u) => (u.email ?? "").toLowerCase() === target) };
  });
