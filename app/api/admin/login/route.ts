import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_DAYS, createAdminSessionToken, isAdminPasswordValid } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password ?? "");

    if (!isAdminPasswordValid(password)) {
      return NextResponse.json({ error: "Senha administrativa incorreta." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_DAYS * 24 * 60 * 60
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Não foi possível entrar." }, { status: 500 });
  }
}
