import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanInstagramHandle, ensureSiteInstagramColumn } from "@/lib/site-settings";

function cleanWhatsapp(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 15);
}

export async function GET() {
  await ensureSiteInstagramColumn();
  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, contactWhatsapp: "77998315360" }
  });
  const rows = await prisma.$queryRaw<Array<{ instagramHandle: string }>>`
    SELECT "instagramHandle" FROM "SiteSettings" WHERE id = 1 LIMIT 1
  `;
  const instagramHandle = cleanInstagramHandle(rows[0]?.instagramHandle) || "_rifas.top";

  return NextResponse.json({
    contactWhatsapp: settings.contactWhatsapp,
    instagramHandle
  });
}

export async function PATCH(request: Request) {
  await ensureSiteInstagramColumn();
  const body = await request.json();
  const contactWhatsapp = cleanWhatsapp(body.contactWhatsapp);
  const instagramHandle = cleanInstagramHandle(body.instagramHandle);

  if (contactWhatsapp.length < 10) {
    return NextResponse.json({ error: "Informe um WhatsApp válido com DDD." }, { status: 400 });
  }

  if (!instagramHandle) {
    return NextResponse.json({ error: "Informe o usuário do Instagram." }, { status: 400 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: { contactWhatsapp },
    create: { id: 1, contactWhatsapp }
  });

  await prisma.$executeRaw`
    UPDATE "SiteSettings"
    SET "instagramHandle" = ${instagramHandle}
    WHERE id = 1
  `;

  return NextResponse.json({ contactWhatsapp: settings.contactWhatsapp, instagramHandle });
}
