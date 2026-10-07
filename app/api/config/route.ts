import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { cleanInstagramHandle, ensureSiteInstagramColumn, getSiteInstagramHandle } from "@/lib/site-settings";

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
  const instagramHandle = await getSiteInstagramHandle();

  return NextResponse.json(
    {
      contactWhatsapp: settings.contactWhatsapp,
      instagramHandle,
      heroImageUrl: settings.heroImageUrl ?? null
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request) {
  await ensureSiteInstagramColumn();
  const body = await request.json();

  const hasWhatsapp = body.contactWhatsapp !== undefined;
  const hasInstagram = body.instagramHandle !== undefined;
  const hasHeroImage = body.heroImageUrl !== undefined;

  if (!hasWhatsapp && !hasInstagram && !hasHeroImage) {
    return NextResponse.json({ error: "Nenhuma configuração foi informada." }, { status: 400 });
  }

  if ((hasWhatsapp || hasInstagram || hasHeroImage) && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const current = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, contactWhatsapp: "77998315360" }
  });

  let contactWhatsapp = current.contactWhatsapp;
  if (hasWhatsapp) {
    contactWhatsapp = cleanWhatsapp(body.contactWhatsapp);
    if (contactWhatsapp.length < 10) {
      return NextResponse.json({ error: "Informe um WhatsApp válido com DDD." }, { status: 400 });
    }

    await prisma.siteSettings.update({
      where: { id: 1 },
      data: { contactWhatsapp }
    });
  }

  let instagramHandle = await getSiteInstagramHandle();
  let heroImageUrl = current.heroImageUrl ?? null;
  if (hasInstagram) {
    instagramHandle = cleanInstagramHandle(body.instagramHandle);
    if (!instagramHandle) {
      return NextResponse.json({ error: "Informe o usuário do Instagram." }, { status: 400 });
    }

    await prisma.$executeRaw`
      UPDATE "SiteSettings"
      SET "instagramHandle" = ${instagramHandle}
      WHERE id = 1
    `;
  }

  if (hasHeroImage) {
    const value = body.heroImageUrl === null ? "" : String(body.heroImageUrl ?? "").trim();
    if (value && !value.startsWith("data:image/")) {
      return NextResponse.json({ error: "A imagem enviada é inválida." }, { status: 400 });
    }
    if (value.length > 2_500_000) {
      return NextResponse.json({ error: "A imagem ficou muito grande. Use uma imagem menor." }, { status: 400 });
    }
    heroImageUrl = value || null;
    await prisma.siteSettings.update({
      where: { id: 1 },
      data: { heroImageUrl }
    });
  }

  return NextResponse.json({ contactWhatsapp, instagramHandle, heroImageUrl });
}
