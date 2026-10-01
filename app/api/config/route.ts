import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function cleanWhatsapp(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 15);
}

export async function GET() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, contactWhatsapp: "77998315360" }
  });

  return NextResponse.json({ contactWhatsapp: settings.contactWhatsapp });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const contactWhatsapp = cleanWhatsapp(body.contactWhatsapp);

  if (contactWhatsapp.length < 10) {
    return NextResponse.json({ error: "Informe um WhatsApp válido com DDD." }, { status: 400 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: { contactWhatsapp },
    create: { id: 1, contactWhatsapp }
  });

  return NextResponse.json({ contactWhatsapp: settings.contactWhatsapp });
}
