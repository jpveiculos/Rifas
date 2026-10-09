import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createMercadoPagoParticipation } from "@/lib/mercadopago";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Faça login para continuar com o pagamento." }, { status: 401 });
    }

    const body = await request.json();
    const reservationId = String(body.reservationId ?? "").trim();
    const rawNumbers = Array.isArray(body.numbers) ? body.numbers : [];
    const numbers = rawNumbers.map(Number);

    if (
      !reservationId ||
      numbers.length < 1 ||
      numbers.length > 100 ||
      numbers.some((number) => !Number.isInteger(number) || number < 0) ||
      new Set(numbers).size !== numbers.length
    ) {
      return NextResponse.json({ error: "Números provisórios inválidos. Gere seus números novamente." }, { status: 400 });
    }

    // A reserva real começa somente quando o cliente clica em "Pagar com Pix".
    // Os números provisórios precisam continuar disponíveis e são reivindicados
    // de forma atômica para impedir que duas pessoas reservem o mesmo número.
    await prisma.$transaction(async (tx) => {
      const existingReservation = await tx.raffleNumber.findMany({
        where: { raffleId: id, reservationId },
        select: { number: true, reservedByUserId: true, status: true }
      });

      if (existingReservation.length > 0) {
        const sameNumbers =
          existingReservation.length === numbers.length &&
          existingReservation.every((item) => numbers.includes(item.number));
        const belongsToUser = existingReservation.every((item) => item.reservedByUserId === user.id);
        const isReserved = existingReservation.every((item) => item.status === "RESERVED");

        if (!sameNumbers || !belongsToUser || !isReserved) {
          throw new Error("RESERVATION_CONFLICT");
        }
        return;
      }

      const available = await tx.raffleNumber.findMany({
        where: { raffleId: id, number: { in: numbers }, status: "AVAILABLE" },
        select: { id: true, number: true }
      });

      if (available.length !== numbers.length) {
        throw new Error("NUMBERS_NO_LONGER_AVAILABLE");
      }

      for (const item of available) {
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
          throw new Error("NUMBERS_NO_LONGER_AVAILABLE");
        }
      }
    });

    const payment = await createMercadoPagoParticipation({
      raffleId: id,
      reservationId,
      userId: user.id
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "NUMBERS_NO_LONGER_AVAILABLE") {
      return NextResponse.json(
        { error: "Um ou mais números provisórios já foram escolhidos por outra pessoa. Gere seus números novamente." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "RESERVATION_CONFLICT") {
      return NextResponse.json({ error: "Esta reserva não corresponde aos números gerados. Gere seus números novamente." }, { status: 409 });
    }

    console.error(error);
    const statusCode = Number((error as Error & { statusCode?: number }).statusCode || 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível iniciar o pagamento." },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
    );
  }
}