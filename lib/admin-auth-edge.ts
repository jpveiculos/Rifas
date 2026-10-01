export const ADMIN_COOKIE = "rifas_admin_session";
const ADMIN_SESSION_DAYS = 30;

function base64Url(bytes: ArrayBuffer | Uint8Array) {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of input) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signature(timestamp: string, password: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return base64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp)));
}

export async function verifyAdminSessionToken(token: string | undefined | null, password: string) {
  if (!token || !password) return false;
  const [timestamp, supplied] = token.split(".");
  if (!timestamp || !supplied || !/^\d+$/.test(timestamp)) return false;

  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000) return false;

  const expected = await signature(timestamp, password);
  if (expected.length !== supplied.length) return false;

  let different = 0;
  for (let i = 0; i < expected.length; i++) different |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return different === 0;
}
