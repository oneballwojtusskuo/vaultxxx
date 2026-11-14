export function isSellerFile(path: string, sellerId: string): boolean {
  const prefix = `${sellerId}/`;
  return path.startsWith(prefix) && path.length > prefix.length && !path.includes("..") && !path.includes("\\") && !path.includes("%");
}

export function trustedAppOrigin(candidate: string): string {
  try {
    const origin = new URL(candidate).origin;
    if (["https://vlnd.pl", "https://www.vlnd.pl", "https://vlnd.lovable.app", "https://id-preview--09f54668-4a05-4338-8a7c-a20024e1c999.lovable.app", "http://localhost:8080"].includes(origin)) return origin;
  } catch { /* Fall back to the canonical application. */ }
  return "https://vlnd.pl";
}