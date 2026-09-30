import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raffle = await prisma.raffle.findUnique({
    where: { id },
    select: {
      id: true,
      raffleCode: true,
      name: true,
      productName: true,
      category: true,
      description: true,
      totalNumbers: true,
      priceInCents: true,
      endDate: true,
      imageUrls: true,
      status: true,
      salesClosedAt: true,
      drawEligibleCount: true,
      federalNumbers: true,
      winningNumber: true,
      winningNumbers: true,
      resultStatus: true,
      resultPublishedAt: true
    }
  });

  if (!raffle) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
  return NextResponse.json({ raffle });
}
