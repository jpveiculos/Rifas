import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { heroImageUrl: true }
  });

  const value = settings?.heroImageUrl ?? "";
  const match = value.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);

  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  const mime = match[1].toLowerCase().replace("jpg", "jpeg");
  const binary = Buffer.from(match[2], "base64");

  return new NextResponse(binary, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400"
    }
  });
}
