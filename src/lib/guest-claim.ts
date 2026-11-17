/** Browser-safe helpers for the one-time guest account claim token. */
export async function hashClaimToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A guest account can be claimed once, only while it has never been signed into. */
export function canClaimGuestAccount(
  user: { app_metadata?: Record<string, unknown>; last_sign_in_at?: string | null },
  tokenHash: string,
): boolean {
  const stored = user.app_metadata?.guest_claim_hash;
  return typeof stored === "string" && stored.length > 0 && stored === tokenHash && !user.last_sign_in_at;
}
