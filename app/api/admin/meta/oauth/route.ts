import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://rifastop.com.br";
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.redirect(baseUrl() + "/admin/login");
  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "META_APP_ID ainda não está configurado no servidor." },
      { status: 503 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = baseUrl() + "/api/admin/meta/callback";
  const permissions = ["ads_management","ads_read","business_management","pages_show_list","pages_read_engagement","instagram_basic"];

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
