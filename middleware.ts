import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth-edge";

const PRIMARY_HOST = "rifastop.com.br";
const OLD_HOSTS = new Set(["rifas.top", "www.rifas.top"]);

function unauthorizedApi() {
  return NextResponse.json({ error: "Autenticação administrativa necessária." }, {
    status: 401,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.nextUrl.hostname.toLowerCase();

  if (OLD_HOSTS.has(hostname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = PRIMARY_HOST;
    return NextResponse.redirect(url, 308);
  }

  const adminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const adminApi =
    pathname === "/api/rifas" || pathname === "/api/config";
  const adminLoginPage = pathname === "/admin/login";
  const adminLoginApi = pathname === "/api/admin/login" || pathname === "/api/admin/logout";

  if (adminLoginPage || adminLoginApi) {
    return NextResponse.next();
  }

  if (!adminPage && !adminApi) {
    return NextResponse.next();
  }

  const configuredPassword = String(process.env.ADMIN_PASSWORD || "");
  if (!configuredPassword) {
    return new NextResponse("Área administrativa não configurada.", {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const authorized = await verifyAdminSessionToken(token, configuredPassword);

  if (!authorized) {
    if (adminApi) return unauthorizedApi();

    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/rifas", "/api/config", "/((?!_next/static|_next/image|favicon.ico).*)"]
};
