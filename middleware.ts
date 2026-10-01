import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Autenticação administrativa necessária.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Rifas.TOP Administração", charset="UTF-8"',
      "Cache-Control": "no-store"
    }
  });
}

function isAuthorized(request: NextRequest) {
  const configuredPassword = String(process.env.ADMIN_PASSWORD || "");
  if (!configuredPassword) return false;

  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;

  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;

    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);

    return username === "admin" && password === configuredPassword;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const adminApi =
    pathname === "/api/rifas" || pathname === "/api/config";

  if (!adminPage && !adminApi) {
    return NextResponse.next();
  }

  if (!process.env.ADMIN_PASSWORD) {
    return new NextResponse("Área administrativa não configurada.", {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }

  if (!isAuthorized(request)) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/rifas"]
};
