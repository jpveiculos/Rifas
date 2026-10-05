import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return new NextResponse("Não autorizado.", { status: 401 });

  try {
    const raffleId = new URL(request.url).searchParams.get("raffleId");
    if (!raffleId) return new NextResponse("Rifa não informada.", { status: 400 });

    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      select: { imageUrls: true }
    });
    const source = Array.isArray(raffle?.imageUrls) ? raffle.imageUrls[0] : "";
    if (!source) return new NextResponse("Imagem oficial não encontrada.", { status: 404 });

    const image = await fetch(source, { cache: "no-store" });
    if (!image.ok) return new NextResponse("Não foi possível carregar a imagem oficial.", { status: 502 });

    const contentType = image.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return new NextResponse("A fonte cadastrada não é uma imagem.", { status: 400 });

    const bytes = await image.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Erro ao carregar a imagem oficial.", { status: 500 });
  }
}
