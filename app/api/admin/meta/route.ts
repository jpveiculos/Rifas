import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  try {
    await ensureMetaTable();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "metaUserId","metaUserName","adAccountId","adAccountName","facebookPageId","facebookPageName","instagramAccountId","instagramUsername","connectedAt","tokenExpiresAt"
       FROM "MetaIntegration" WHERE "id"=1 LIMIT 1`
    );
    return NextResponse.json({ connected: Boolean(rows[0]?.metaUserId), integration: rows[0] || null });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar a integração Meta." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await ensureMetaTable();
    await prisma.$executeRawUnsafe(`DELETE FROM "MetaIntegration" WHERE "id"=1`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível desconectar a Meta." }, { status: 500 });
  }
}
