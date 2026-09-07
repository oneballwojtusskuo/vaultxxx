import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

export type RequestMeta = { ip: string | null; userAgent: string | null };

/** Best-effort IP + User-Agent of the current server request. */
export function getRequestMeta(): RequestMeta {
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? null;
  } catch {
    ip = null;
  }
  try {
    userAgent = getRequestHeader("user-agent") ?? null;
  } catch {
    userAgent = null;
  }
  return { ip, userAgent };
}

type AuditInsert = {
  transactionId: string | null;
  userId: string;
  listingId: string | null;
  eventType: "checkout" | "download";
  meta: RequestMeta;
  withdrawalWaiverAccepted?: boolean;
  licenseHash?: string | null;
  checkoutAt?: string | null;
  downloadedAt?: string | null;
};

/** Append-only audit trail used as chargeback evidence. Never throws. */
export async function writeAuditLog(supabaseAdmin: any, entry: AuditInsert): Promise<void> {
  try {
    await supabaseAdmin.from("transaction_audit_logs").insert({
      transaction_id: entry.transactionId,
      user_id: entry.userId,
      listing_id: entry.listingId,
      event_type: entry.eventType,
      ip_address: entry.meta.ip,
      user_agent: entry.meta.userAgent,
      timestamp_checkout: entry.checkoutAt ?? null,
      timestamp_downloaded: entry.downloadedAt ?? null,
      withdrawal_waiver_accepted: entry.withdrawalWaiverAccepted ?? false,
      license_hash: entry.licenseHash ?? null,
    });
  } catch (error) {
    console.error("audit log insert failed", error);
  }
}
