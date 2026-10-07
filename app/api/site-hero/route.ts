import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { heroImageUrl: true }
  });

  const value = settings?.heroImageUrl;
  if (!value || !value.startsWith("data:image/")) {
    return new NextResponse("Imagem não configurada.", { status: 404 });
  }

  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return new NextResponse("Imagem inválida.", { status: 422 });
  }

  const buffer = Buffer.from(match[2], "base64");
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
