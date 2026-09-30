import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const API_URL = "https://api.mercadopago.com";
const ACCESS_TOKEN = String(process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
const WEBHOOK_SECRET = String(process.env.MERCADOPAGO_WEBHOOK_SECRET || "").trim();
const PAYMENT_EXPIRATION = "PT30M";

function moneyInCents(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error("Valor financeiro inválido.");
  return Math.round(value);
}

function assertConfigured() {
  if (!ACCESS_TOKEN) throw new Error("Mercado Pago ainda não está configurado no servidor.");
}

async function mpRequest(path: string, options: RequestInit = {}) {
  assertConfigured();

  const response = await fetch(API_URL + path, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      body?.message ||
      body?.error ||
      body?.cause?.[0]?.description ||
      body?.cause?.[0]?.code ||
      "Mercado Pago recusou a operação.";

    console.error("Mercado Pago API error", {
      path,
      status: response.status,
      requestId: response.headers.get("x-request-id") || "",
      detail
    });

    throw new Error(`Mercado Pago (${response.status}): ${detail}`);
  }

  return body;
}

function verifyWebhookSignature(signature: string | null, requestId: string | null, dataId: string) {
  if (!WEBHOOK_SECRET) throw new Error("MERCADOPAGO_WEBHOOK_SECRET não configurado.");

  const cleanSignature = String(signature || "").trim();
  const cleanRequestId = String(requestId || "").trim();
  const cleanDataId = String(dataId || "").trim().toLowerCase();

  if (!cleanSignature || !cleanRequestId || !cleanDataId) return false;

  let ts = "";
  const receivedSignatures: string[] = [];

  for (const part of cleanSignature.split(",")) {
    const [rawKey, ...rest] = part.split("=");
    const key = String(rawKey || "").trim();
    const value = rest.join("=").trim();

    if (key === "ts") ts = value;
    if (key === "v1" && value) receivedSignatures.push(value.toLowerCase());
  }

  if (!ts || receivedSignatures.length === 0) return false;

  const manifest = `id:${cleanDataId};request-id:${cleanRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");

  return receivedSignatures.some((received) => {
    if (!/^[0-9a-f]{64}$/.test(received)) return false;

    const a = Buffer.from(received, "hex");
    const b = Buffer.from(expected, "hex");

    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

async function getOrder(orderId: string) {
  return mpRequest(`/v1/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
}

function paymentData(participation: any) {
  return {
    id: participation.id,
    status: participation.status,
    amountInCents: participation.amountInCents,
    orderId: participation.mercadopagoOrderId,
    qrCode: participation.mercadopagoQrCode,
    qrCodeBase64: participation.mercadopagoQrCodeBase64,
    ticketUrl: participation.mercadopagoTicketUrl,
    orderStatus: participation.mercadopagoStatus,
    orderStatusDetail: participation.mercadopagoStatusDetail
  };
}

export async function createMercadoPagoParticipation({
  raffleId,
  reservationId,
  userId
}: {
  raffleId: string;
  reservationId: string;
  userId: string;
}) {
  const existing = await prisma.raffleParticipation.findUnique({
    where: { reservationId }
  });

  if (existing) {
    if (existing.userId !== userId || existing.raffleId !== raffleId) {
      throw new Error("Reserva inválida.");
    }

    return paymentData(existing);
  }

  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    select: {
      id: true,
      name: true,
      productName: true,
      priceInCents: true,
      status: true,
      endDate: true
    }
  });

  if (!raffle || raffle.status !== "ACTIVE" || (raffle.endDate && raffle.endDate <= new Date())) {
    throw new Error("Esta rifa não está disponível para pagamento.");
  }

  const reservedNumbers = await prisma.raffleNumber.findMany({
    where: {
      raffleId,
      reservationId,
      reservedByUserId: userId,
      status: "RESERVED"
    },
    select: { id: true, number: true }
  });

  if (reservedNumbers.length === 0) {
    throw new Error("A reserva não foi encontrada ou já foi processada.");
  }

  const amountInCents = moneyInCents(raffle.priceInCents * reservedNumbers.length);
  const participation = await prisma.raffleParticipation.create({
    data: {
      raffleId,
      userId,
      reservationId,
      quantity: reservedNumbers.length,
      amountInCents
    }
  });

  try {
    const amount = (amountInCents / 100).toFixed(2);
    const order = await mpRequest("/v1/orders", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": crypto.randomUUID()
      },
      body: JSON.stringify({
        type: "online",
        total_amount: amount,
        external_reference: `rifas_participation_${participation.id}`,
        processing_mode: "automatic",
        transactions: {
          payments: [{
            amount,
            payment_method: {
              id: "pix",
              type: "bank_transfer"
            },
            expiration_time: PAYMENT_EXPIRATION
          }]
        },
        payer: {
          email: `usuario-${userId}@rifas.top`
        }
      })
    });

    const payment = order?.transactions?.payments?.[0];
    const paymentMethod = payment?.payment_method;

    if (!order?.id || !paymentMethod?.qr_code) {
      throw new Error("O Mercado Pago não retornou o QR Code Pix.");
    }

    const updated = await prisma.raffleParticipation.update({
      where: { id: participation.id },
      data: {
        mercadopagoOrderId: String(order.id),
        mercadopagoStatus: String(order.status || "action_required"),
        mercadopagoStatusDetail: String(order.status_detail || "waiting_transfer"),
        mercadopagoPaidAmountInCents: 0,
        mercadopagoQrCode: String(paymentMethod.qr_code),
        mercadopagoQrCodeBase64: String(paymentMethod.qr_code_base64 || ""),
        mercadopagoTicketUrl: String(paymentMethod.ticket_url || "")
      }
    });

    return paymentData(updated);
  } catch (error) {
    await prisma.$transaction([
      prisma.raffleParticipation.update({
        where: { id: participation.id },
        data: {
          status: "REJECTED",
          mercadopagoStatus: "failed",
          mercadopagoStatusDetail: String(error instanceof Error ? error.message : "Falha ao criar pagamento.")
        }
      }),
      prisma.raffleNumber.updateMany({
        where: {
          raffleId,
          reservationId,
          reservedByUserId: userId,
          status: "RESERVED"
        },
        data: {
          status: "AVAILABLE",
          reservationId: null,
          reservedAt: null,
          reservedByUserId: null
        }
      })
    ]);

    throw error;
  }
}

export async function syncMercadoPagoParticipation(participationId: string, userId?: string) {
  const participation = await prisma.raffleParticipation.findFirst({
    where: {
      id: participationId,
      ...(userId ? { userId } : {})
    }
  });

  if (!participation) {
    const error = new Error("Participação não encontrada.");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (!participation.mercadopagoOrderId) {
    return paymentData(participation);
  }

  const order = await getOrder(participation.mercadopagoOrderId);
  await applyMercadoPagoOrder(participation.id, order);

  const updated = await prisma.raffleParticipation.findUnique({
    where: { id: participation.id }
  });

  return paymentData(updated || participation);
}

async function applyMercadoPagoOrder(participationId: string, order: any) {
  const paidAmountInCents = Math.round(Number(order?.total_paid_amount || 0) * 100);
  const orderStatus = String(order?.status || "");
  const orderStatusDetail = String(order?.status_detail || "");

  await prisma.$transaction(async (tx) => {
    const participation = await tx.raffleParticipation.findUnique({
      where: { id: participationId }
    });

    if (!participation) return;

    await tx.raffleParticipation.update({
      where: { id: participationId },
      data: {
        mercadopagoStatus: orderStatus || null,
        mercadopagoStatusDetail: orderStatusDetail || null,
        mercadopagoPaidAmountInCents: paidAmountInCents
      }
    });

    if (participation.status === "APPROVED") return;

    if (orderStatus === "processed" && orderStatusDetail === "accredited") {
      if (paidAmountInCents < participation.amountInCents) {
        throw new Error("O valor confirmado pelo Mercado Pago é inferior ao valor da participação.");
      }

      const updatedNumbers = await tx.raffleNumber.updateMany({
        where: {
          raffleId: participation.raffleId,
          reservationId: participation.reservationId,
          reservedByUserId: participation.userId,
          status: "RESERVED"
        },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date()
        }
      });

      if (updatedNumbers.count !== participation.quantity) {
        throw new Error("A reserva não contém mais a quantidade esperada de números.");
      }

      await tx.raffleParticipation.update({
        where: { id: participation.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date()
        }
      });

      return;
    }

    if (["failed", "canceled", "expired", "refunded"].includes(orderStatus)) {
      await tx.raffleNumber.updateMany({
        where: {
          raffleId: participation.raffleId,
          reservationId: participation.reservationId,
          reservedByUserId: participation.userId,
          status: "RESERVED"
        },
        data: {
          status: "AVAILABLE",
          reservationId: null,
          reservedAt: null,
          reservedByUserId: null
        }
      });

      await tx.raffleParticipation.update({
        where: { id: participation.id },
        data: { status: "REJECTED" }
      });
    }
  });
}

export async function handleMercadoPagoWebhook({
  signature,
  requestId,
  dataId
}: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
}) {
  const valid = verifyWebhookSignature(signature, requestId, dataId);

  if (!valid) {
    const error = new Error("Assinatura do webhook do Mercado Pago inválida.");
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }

  const orderId = String(dataId || "").trim();
  if (!orderId) return { ignored: true };

  const order = await getOrder(orderId);
  const reference = String(order?.external_reference || "");
  const match = reference.match(/^rifas_participation_(.+)$/);

  if (!match) return { ignored: true };

  const participation = await prisma.raffleParticipation.findUnique({
    where: { id: match[1] }
  });

  if (!participation || participation.mercadopagoOrderId !== orderId) {
    return { ignored: true };
  }

  await applyMercadoPagoOrder(participation.id, order);

  return {
    ok: true,
    participationId: participation.id,
    orderStatus: order.status,
    orderStatusDetail: order.status_detail
  };
}

export function isMercadoPagoConfigured() {
  return Boolean(ACCESS_TOKEN && WEBHOOK_SECRET);
}
