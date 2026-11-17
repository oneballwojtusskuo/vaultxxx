import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { validateUsername } from "./profanity";
import { canClaimGuestAccount, hashClaimToken } from "./guest-claim";

const ClaimSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  claimToken: z.string().regex(/^[0-9a-f]{64}$/),
  username: z.string().trim().toLowerCase().min(3).max(30),
  password: z.string().min(8).max(72),
});

/** Sets password + username on a silently created guest account, using the one-time claim token. */
export const claimGuestAccount = createServerFn({ method: "POST" })
  .inputValidator((input) => ClaimSchema.parse(input))
  .handler(async ({ data }) => {
    const unameError = validateUsername(data.username);
    if (unameError) return { ok: false as const, error: unameError };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userId } = await (supabaseAdmin as any).rpc("find_user_id_by_email", { _email: data.email });
    if (!userId) return { ok: false as const, error: "Nie znaleziono zakupu." };
    const { data: got } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!got?.user || !canClaimGuestAccount(got.user as any, await hashClaimToken(data.claimToken)))
      return { ok: false as const, error: "Ten link wygasł. Zaloguj się, aby pobrać plik." };
    const { data: taken } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", data.username)
      .neq("id", userId)
      .maybeSingle();
    if (taken) return { ok: false as const, error: "Ta nazwa użytkownika jest już zajęta" };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.password,
      email_confirm: true,
      user_metadata: { passwordless_checkout: "false", guest_checkout: "false" },
      app_metadata: { guest_claim_hash: null },
    });
    if (error) return { ok: false as const, error: "Nie udało się zapisać hasła." };
    await supabaseAdmin
      .from("profiles")
      .update({ username: data.username, display_name: data.username, onboarding_completed: true } as any)
      .eq("id", userId);
    return { ok: true as const };
  });
