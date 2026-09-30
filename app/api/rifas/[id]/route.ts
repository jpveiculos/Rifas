import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raffle = await prisma.raffle.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      productName: true,
      description: true,
      totalNumbers: true,
      priceInCents: true,
      endDate: true,
      imageUrls: true,
      status: true
    }
  });

  if (!raffle) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
  return NextResponse.json({ raffle });
}
