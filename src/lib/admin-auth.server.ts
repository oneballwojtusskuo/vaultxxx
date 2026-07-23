import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OWNER_ADMIN_EMAIL = "chujcinaryjsuko@gmail.com";

export function isOwnerAdminEmail(claims: unknown) {
  const claimData = claims as { email?: unknown; user_metadata?: { email?: unknown } };
  const email = typeof claimData.email === "string" ? claimData.email : claimData.user_metadata?.email;
  return typeof email === "string" && email.toLowerCase() === OWNER_ADMIN_EMAIL;
}

export async function getAdminClientForContext(context: { claims: unknown; userId: string }) {
  if (isOwnerAdminEmail(context.claims)) {
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw error;
    return supabaseAdmin;
  }

  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Response("Forbidden", { status: 403 });

  return supabaseAdmin;
}