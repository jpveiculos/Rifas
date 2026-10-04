import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
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
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    await ensureMetaTable();
    await prisma.$executeRawUnsafe(`DELETE FROM "MetaIntegration" WHERE "id"=1`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível desconectar a Meta." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    await ensureMetaTable();
    await prisma.$executeRawUnsafe(
      `UPDATE "MetaIntegration"
       SET "adAccountId"=$1,"adAccountName"=$2,"facebookPageId"=$3,"facebookPageName"=$4,
           "instagramAccountId"=$5,"instagramUsername"=$6,"updatedAt"=NOW()
       WHERE "id"=1`,
      body.adAccountId || null,
      body.adAccountName || null,
      body.facebookPageId || null,
      body.facebookPageName || null,
      body.instagramAccountId || null,
      body.instagramUsername || null
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar os recursos Meta." }, { status: 500 });
  }
}
