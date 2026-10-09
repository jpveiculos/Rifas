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
      return NextResponse.json({ error: "Esta rifa não está disponível para novas participações." }, { status: 409 });
    }

    const body = await request.json();
    const quantity = Number(body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
    }

    // Nesta etapa os números são apenas sugestões provisórias para a tela.
    // Não são reservados no banco até o cliente solicitar a geração do Pix.
    const available = await prisma.raffleNumber.findMany({
      where: { raffleId: id, status: "AVAILABLE" },
      select: { number: true },
      take: Math.min(quantity * 10, 1000)
    });

    if (available.length < quantity) {
      return NextResponse.json({ error: "Não há números suficientes disponíveis." }, { status: 409 });
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, quantity);
    const reservationId = crypto.randomUUID();

    return NextResponse.json({
      reservationId,
      numbers: shuffled.map((item) => item.number).sort((a, b) => a - b)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível gerar os números." }, { status: 500 });
  }
}