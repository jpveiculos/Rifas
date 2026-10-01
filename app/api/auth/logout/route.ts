import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth";

export async function POST(request: Request) {
  await endSession();
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.json({ ok: true });
}
