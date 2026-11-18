/** HMAC-signed purchase download tokens: "<transactionId>.<hexSig>". Server-only use (needs secret). */
async function sign(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`download:${value}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createDownloadToken(secret: string, transactionId: string): Promise<string> {
  return `${transactionId}.${await sign(secret, transactionId)}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns the transaction id when the token is authentic, otherwise null. */
export async function verifyDownloadToken(secret: string, token: string): Promise<string | null> {
  const [id, sig, extra] = token.split(".");
  if (extra !== undefined || !id || !sig || !UUID.test(id)) return null;
  const expected = await sign(secret, id);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? id : null;
}
