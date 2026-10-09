import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = "https://api.mercadopago.com";
const ACCESS_TOKEN = String(process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();

async function getOrder(orderId) {
  const response = await fetch(`${API_URL}/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Mercado Pago GET order failed (${response.status}): ${body?.message || body?.error || "unknown error"}`);
  }
  return body;
}

async function reconcileParticipation(participation, order) {
  const orderStatus = String(order?.status || "");
  const orderStatusDetail = String(order?.status_detail || "");
  const paidAmountInCents = Math.round(Number(order?.total_paid_amount || 0) * 100);

  await prisma.$transaction(async (tx) => {
    const current = await tx.raffleParticipation.findUnique({
      where: { id: participation.id },
      select: {
        id: true, raffleId: true, reservationId: true, userId: true,
        quantity: true, amountInCents: true, status: true, mercadopagoOrderId: true
      }
    });
    if (!current || current.status !== "PENDING" || current.mercadopagoOrderId !== String(order?.id || "")) return;

    await tx.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${current.raffleId}))`
    );

    await tx.raffleParticipation.update({
      where: { id: current.id },
      data: {
        mercadopagoStatus: orderStatus || null,
        mercadopagoStatusDetail: orderStatusDetail || null,
        mercadopagoPaidAmountInCents: paidAmountInCents
      }
    });

    if (orderStatus === "processed" && orderStatusDetail === "accredited") {
      if (paidAmountInCents < current.amountInCents) {
        console.error("Pagamento acreditado com valor inferior; mantido pendente para revisão.", {
          participationId: current.id,
          orderId: current.mercadopagoOrderId,
          expectedCents: current.amountInCents,
          paidCents: paidAmountInCents
        });
        return;
      }

      const numbers = await tx.raffleNumber.updateMany({
        where: {
          raffleId: current.raffleId,
          reservationId: current.reservationId,
          reservedByUserId: current.userId,
          status: "RESERVED"
        },
        data: { status: "CONFIRMED", confirmedAt: new Date() }
      });

      if (numbers.count !== current.quantity) {
        throw new Error(`Reservation mismatch for participation ${current.id}: expected ${current.quantity}, found ${numbers.count}. No approval applied.`);
      }

      await tx.raffleParticipation.update({
        where: { id: current.id },
        data: { status: "APPROVED", approvedAt: new Date() }
      });

      console.log("Pagamento conciliado e aprovado.", {
        participationId: current.id,
        orderId: current.mercadopagoOrderId,
        amountInCents: paidAmountInCents
      });
      return;
    }

    if (["failed", "canceled", "expired"].includes(orderStatus)) {
      await tx.raffleNumber.updateMany({
        where: {
          raffleId: current.raffleId,
          reservationId: current.reservationId,
          reservedByUserId: current.userId,
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
        where: { id: current.id },
        data: { status: "REJECTED" }
      });
      console.log("Participação encerrada após status final negativo do Mercado Pago.", {
        participationId: current.id,
        orderId: current.mercadopagoOrderId,
        orderStatus
      });
    }
  });
}

async function main() {
  // A notificação webhook continua sendo o caminho principal. Esta rotina de
  // reconciliação é a segunda via: consulta orders pendentes periodicamente,
  // para recuperar confirmações quando uma notificação atrasar ou não chegar.
  if (!ACCESS_TOKEN) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado no serviço de limpeza.");
  }

  const sessions = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });

  const pending = await prisma.raffleParticipation.findMany({
    where: {
      status: "PENDING",
      mercadopagoOrderId: { not: null }
    },
    orderBy: { updatedAt: "asc" },
    take: 100,
    select: {
      id: true,
      mercadopagoOrderId: true,
      updatedAt: true
    }
  });

  let checked = 0;
  let errors = 0;
  for (const participation of pending) {
    if (!participation.mercadopagoOrderId) continue;
    try {
      const order = await getOrder(participation.mercadopagoOrderId);
      await reconcileParticipation(participation, order);
      // Move a tentativa para o fim da fila, para que uma ordem problemática
      // não impeça as demais participações pendentes de serem verificadas.
      await prisma.raffleParticipation.updateMany({
        where: { id: participation.id, status: "PENDING" },
        data: {
          mercadopagoStatus: String(order?.status || "") || null,
          mercadopagoStatusDetail: String(order?.status_detail || "") || null,
          mercadopagoPaidAmountInCents: Math.round(Number(order?.total_paid_amount || 0) * 100)
        }
      });
      checked++;
    } catch (error) {
      errors++;
      console.error("Falha ao reconciliar participação pendente:", {
        participationId: participation.id,
        orderId: participation.mercadopagoOrderId,
        error: error instanceof Error ? error.message : String(error)
      });
      // Atualiza updatedAt sem mudar o status para permitir que outras
      // participações também sejam tentadas na próxima execução.
      await prisma.raffleParticipation.updateMany({
        where: { id: participation.id, status: "PENDING" },
        data: { updatedAt: new Date() }
      }).catch(() => {});
    }
  }

  console.log(`Reconciliação concluída: ${checked} pedidos consultados, ${errors} falhas, ${pending.length} pendentes na fila; ${sessions.count} sessões expiradas removidas.`);
}

main()
  .catch((error) => {
    console.error("Falha na limpeza/reconciliação:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
