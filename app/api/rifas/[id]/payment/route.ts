import { NextResponse } from "next/server";
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

    if (!reservationId) {
      return NextResponse.json({ error: "Reserva inválida." }, { status: 400 });
    }

    const payment = await createMercadoPagoParticipation({
      raffleId: id,
      reservationId,
      userId: user.id
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error(error);
    const statusCode = Number((error as Error & { statusCode?: number }).statusCode || 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível criar o pagamento." },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
    );
  }
}
