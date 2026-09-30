import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncMercadoPagoParticipation } from "@/lib/mercadopago";

type Params = { params: Promise<{ id: string; participationId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id, participationId } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Faça login para consultar o pagamento." }, { status: 401 });

    const result = await syncMercadoPagoParticipation(participationId, user.id);

    if (result && !result.id) {
      return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ raffleId: id, payment: result });
  } catch (error) {
    console.error(error);
    const statusCode = Number((error as Error & { statusCode?: number }).statusCode || 500);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível consultar o pagamento." },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
    );
  }
}
