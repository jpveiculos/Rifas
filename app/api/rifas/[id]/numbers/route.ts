import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Faça login para participar da rifa." }, { status: 401 });
    }

    const raffle = await prisma.raffle.findUnique({
      where: { id },
      select: { status: true, endDate: true }
    });

    if (!raffle || raffle.status !== "ACTIVE" || (raffle.endDate && raffle.endDate <= new Date())) {
      return NextResponse.json({ error: "Esta rifa não está disponível para novas reservas." }, { status: 409 });
    }

    const body = await request.json();
    const quantity = Number(body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
    }


    const available = await prisma.raffleNumber.findMany({
      where: { raffleId: id, status: "AVAILABLE" },
      select: { id: true, number: true },
      take: quantity * 5
    });

    if (available.length < quantity) {
      return NextResponse.json({ error: "Não há números suficientes disponíveis." }, { status: 409 });
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, quantity);
    const reservationId = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      for (const item of shuffled) {
        const updated = await tx.raffleNumber.updateMany({
          where: { id: item.id, status: "AVAILABLE" },
          data: {
            status: "RESERVED",
            reservationId,
            reservedAt: new Date(),
            reservedByUserId: user.id
          }
        });

        if (updated.count !== 1) {
          throw new Error("NUMBER_CONFLICT");
        }
      }
    });

    return NextResponse.json({
      reservationId,
      numbers: shuffled.map((item) => item.number).sort((a, b) => a - b)
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NUMBER_CONFLICT") {
      return NextResponse.json({ error: "Os números acabaram de ser alterados. Tente novamente." }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: "Não foi possível reservar os números." }, { status: 500 });
  }
}