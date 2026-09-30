import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);

  const released = await prisma.raffleNumber.updateMany({
    where: {
      status: "RESERVED",
      reservedAt: { lt: cutoff }
    },
    data: {
      status: "AVAILABLE",
      reservationId: null,
      reservedAt: null,
      reservedByUserId: null
    }
  });

  const rejected = await prisma.raffleParticipation.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: cutoff }
    },
    data: {
      status: "REJECTED",
      mercadopagoStatus: "expired",
      mercadopagoStatusDetail: "Reserva expirada após 30 minutos sem pagamento."
    }
  });

  const sessions = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });

  console.log(
    `Limpeza concluída: ${released.count} reservas liberadas, ${rejected.count} pagamentos pendentes expirados e ${sessions.count} sessões expiradas removidas.`
  );
}

main()
  .catch((error) => {
    console.error("Falha na limpeza de reservas:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
