import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureMarketingTables } from "@/lib/marketing-db";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    await ensureMarketingTables();
    const { code } = await context.params;
    const rows = await prisma.$queryRawUnsafe<Array<{ destinationPath: string }>>(
      'SELECT "destinationPath" FROM "MarketingVariant" WHERE "trackingCode"=$1 LIMIT 1',
      code
    );
    const destinationPath = rows[0]?.destinationPath || "/";
    await prisma.$executeRawUnsafe(
      'INSERT INTO "MarketingClick" ("id","trackingCode","referrer","userAgent") VALUES ($1,$2,$3,$4)',
      randomUUID(), code, request.headers.get("referer"), request.headers.get("user-agent")
    );
    return NextResponse.redirect(new URL(destinationPath, request.url), 302);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/", request.url), 302);
  }
}
