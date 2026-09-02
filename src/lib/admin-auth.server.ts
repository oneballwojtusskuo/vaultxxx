import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OWNER_ADMIN_EMAIL = "chujcinaryjsuko@gmail.com";

export function getClaimEmail(claims: unknown) {
  const claimData = claims as {
    email?: unknown;
    user_metadata?: { email?: unknown };
  };

  const email =
    typeof claimData.email === "string"
      ? claimData.email
      : claimData.user_metadata?.email;

  return typeof email === "string" ? email.toLowerCase() : null;
}

export function isOwnerAdminEmail(claims: unknown) {
  return getClaimEmail(claims) === OWNER_ADMIN_EMAIL;
}

export async function getAdminClientForContext(context: { claims: unknown; userId: string }) {
  if (isOwnerAdminEmail(context.claims)) {
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw error;
    return supabaseAdmin;
  }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) throw roleError;
  if (roleRow) return supabaseAdmin;

  try {
    const { data: userRecord, error: userError } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const userEmail = userRecord?.user?.email?.toLowerCase();

    if (!userError && userEmail && userEmail === OWNER_ADMIN_EMAIL) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw error;
      return supabaseAdmin;
    }
  } catch {
    // Ignore lookup failures and fall through to a clean 403.
  }

  throw new Response("Forbidden", { status: 403 });
}