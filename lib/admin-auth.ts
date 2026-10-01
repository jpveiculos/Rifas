import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "rifas_admin_session";
export const ADMIN_SESSION_DAYS = 30;

function secret() {
  const value = String(process.env.ADMIN_PASSWORD || "");
  if (!value) throw new Error("ADMIN_PASSWORD não configurada.");
  return value;
}

function sign(timestamp: string) {
  return createHmac("sha256", secret()).update(timestamp).digest("base64url");
}

export function createAdminSessionToken() {
  const timestamp = String(Date.now());
  return timestamp + "." + sign(timestamp);
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) return false;
  const [timestamp, signature] = token.split(".");
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;

  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000) return false;

  const expected = sign(timestamp);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAdminPasswordValid(password: string) {
  const configured = String(process.env.ADMIN_PASSWORD || "");
  if (!configured || !password) return false;
  return password === configured;
}
