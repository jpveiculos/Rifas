import { createHmac, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://rifastop.com.br";
}

function createState(secret: string) {
  const nonce = randomBytes(24).toString("hex");
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const payload = nonce + "." + issuedAt;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return payload + "." + signature;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.redirect(baseUrl() + "/admin/login");
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: "META_APP_ID ou META_APP_SECRET ainda não está configurado no servidor." },
      { status: 503 }
    );
  }

  // O state agora é auto-validável por assinatura. Isso evita que Safari/Meta descarte
  // o cookie durante o retorno OAuth e faça a conexão parecer que voltou ao início.
  const state = createState(appSecret);
  const redirectUri = baseUrl() + "/api/admin/meta/callback";
  const permissions = ["ads_management","ads_read","business_management","pages_show_list","pages_read_engagement"];

  const url = new URL("https://www.facebook.com/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", permissions.join(","));
  url.searchParams.set("response_type", "code");

  const response = NextResponse.redirect(url);
  response.cookies.set("rifastop_meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/"
  });
  return response;
}
