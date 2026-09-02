/** Turn server-fn / Stripe / Postgres errors into a short Polish message. */
export function userFacingError(
  e: unknown,
  fallback = "Coś poszło nie tak. Spróbuj ponownie.",
): string {
  const raw =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e && "message" in e
        ? String((e as { message?: unknown }).message ?? "")
        : String(e ?? "");

  const msg = raw.toLowerCase();
  if (!raw) return fallback;
  if (
    msg.includes("duplicate key") ||
    msg.includes("unique constraint") ||
    msg.includes("product_likes_pkey")
  ) {
    return "";
  }
  if (
    msg.includes("płatności nie są skonfigurowane") ||
    msg.includes("stripe") ||
    msg.includes("ui_mode") ||
    msg.includes("payment_method")
  ) {
    return "Nie udało się otworzyć płatności. Spróbuj ponownie za chwilę.";
  }
  if (msg.includes("unauthorized") || msg.includes("jwt")) {
    return "Sesja wygasła. Zaloguj się ponownie.";
  }
  if (raw.length > 180 || msg.includes("at ") || msg.includes("stack")) return fallback;
  return raw;
}
