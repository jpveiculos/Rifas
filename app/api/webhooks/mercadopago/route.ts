import { NextResponse } from "next/server";
import { handleMercadoPagoWebhook } from "@/lib/mercadopago";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const dataId = String(url.searchParams.get("data.id") || "").trim();

    const result = await handleMercadoPagoWebhook({
      signature: request.headers.get("x-signature"),
      requestId: request.headers.get("x-request-id"),
      dataId
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error(error);
    const statusCode = Number((error as Error & { statusCode?: number }).statusCode || 500);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook inválido." },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
    );
  }
}
