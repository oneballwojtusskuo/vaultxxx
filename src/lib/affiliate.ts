// Referral (affiliate) cookie helpers — browser only.
// Cookie name is scoped per-product so different products can hold different refs.
// Affiliate cookies are non-essential: they are only written after the visitor
// opted into the "afiliacyjne" category in the cookie banner.

import { affiliationCookiesAllowed } from "@/components/cookie-banner";

const DAYS = 30;

const cookieName = (productId: string) => `vaultx_ref_${productId}`;

export function setReferralCookie(productId: string, referrerId: string) {
  if (typeof document === "undefined") return;
  if (!affiliationCookiesAllowed()) return;
  const maxAge = DAYS * 24 * 60 * 60;
  document.cookie = `${cookieName(productId)}=${encodeURIComponent(
    referrerId,
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}


export function getReferralCookie(productId: string): string | null {
  if (typeof document === "undefined") return null;
  const name = cookieName(productId) + "=";
  const parts = document.cookie.split(";");
  for (const p of parts) {
    const c = p.trim();
    if (c.startsWith(name)) return decodeURIComponent(c.slice(name.length));
  }
  return null;
}

export function clearReferralCookie(productId: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${cookieName(productId)}=; path=/; max-age=0; SameSite=Lax`;
}

export function buildReferralLink(productId: string, referrerId: string): string {
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}/product/${productId}`
      : `/product/${productId}`;
  const url = new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  url.searchParams.set("ref", referrerId);
  return url.toString();
}
