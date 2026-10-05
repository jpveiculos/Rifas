import { createCipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://rifastop.com.br";
}
function encryptionKey() {
  const raw = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("META_TOKEN_ENCRYPTION_KEY não configurada.");
  return createHash("sha256").update(raw).digest();
}
function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}
function verifyState(state: string, secret: string) {
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const [nonce, issuedAt, signature] = parts;
  if (!nonce || !issuedAt || !signature || !/^\d+$/.test(issuedAt)) return false;
  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  if (age < -60 || age > 600) return false;
  const expected = createHmac("sha256", secret).update(nonce + "." + issuedAt).digest("hex");
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
async function ensureMetaTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MetaIntegration" (
      "id" INTEGER PRIMARY KEY DEFAULT 1,
      "accessTokenEncrypted" TEXT,
      "tokenExpiresAt" TIMESTAMPTZ,
      "metaUserId" TEXT,
      "metaUserName" TEXT,
      "adAccountId" TEXT,
      "adAccountName" TEXT,
      "facebookPageId" TEXT,
      "facebookPageName" TEXT,
      "instagramAccountId" TEXT,
      "instagramUsername" TEXT,
      "connectedAt" TIMESTAMPTZ,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.redirect(baseUrl() + "/admin/login");
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error");
  if (error) return NextResponse.redirect(baseUrl() + "/admin/meta?error=" + encodeURIComponent(error));
  if (!code || !state) return NextResponse.redirect(baseUrl() + "/admin/meta?error=Resposta inválida da Meta");

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return NextResponse.redirect(baseUrl() + "/admin/meta?error=Integração Meta incompleta no servidor");

  // Não dependemos mais do cookie para validar o retorno OAuth.
  // O state é assinado pelo próprio servidor e continua protegido contra CSRF.
  if (!verifyState(state, appSecret)) {
    return NextResponse.redirect(baseUrl() + "/admin/meta?error=" + encodeURIComponent("Validação de segurança da conexão falhou ou o link expirou. Tente conectar novamente."));
  }

  const appId = process.env.META_APP_ID;
  const redirectUri = baseUrl() + "/api/admin/meta/callback";
  if (!appId || !process.env.META_TOKEN_ENCRYPTION_KEY) {
    return NextResponse.redirect(baseUrl() + "/admin/meta?error=Integração Meta incompleta no servidor");
  }

  try {
    const version = process.env.META_GRAPH_API_VERSION || "v24.0";
    const tokenUrl = new URL("https://graph.facebook.com/" + version + "/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl, { cache: "no-store" });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error?.message || "A Meta não forneceu o token de acesso.");

    const debugUrl = new URL("https://graph.facebook.com/" + version + "/me");
    debugUrl.searchParams.set("fields", "id,name");
    debugUrl.searchParams.set("access_token", tokenData.access_token);
    const meResponse = await fetch(debugUrl, { cache: "no-store" });
    const me = await meResponse.json();
    if (!meResponse.ok || !me.id) throw new Error(me.error?.message || "A Meta autorizou, mas não foi possível validar o usuário conectado.");

    await ensureMetaTable();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "MetaIntegration" ("id","accessTokenEncrypted","tokenExpiresAt","metaUserId","metaUserName","connectedAt","updatedAt")
       VALUES (1,$1,$2,$3,$4,NOW(),NOW())
       ON CONFLICT ("id") DO UPDATE SET "accessTokenEncrypted"=EXCLUDED."accessTokenEncrypted","tokenExpiresAt"=EXCLUDED."tokenExpiresAt","metaUserId"=EXCLUDED."metaUserId","metaUserName"=EXCLUDED."metaUserName","connectedAt"=EXCLUDED."connectedAt","updatedAt"=NOW()`,
      encrypt(tokenData.access_token),
      tokenData.expires_in ? new Date(Date.now() + Number(tokenData.expires_in) * 1000) : null,
      me.id || null, me.name || null
    );

    const response = NextResponse.redirect(baseUrl() + "/admin/meta?connected=1");
    response.cookies.delete("rifastop_meta_oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível concluir a conexão com a Meta.";
    return NextResponse.redirect(baseUrl() + "/admin/meta?error=" + encodeURIComponent(message));
  }
}
