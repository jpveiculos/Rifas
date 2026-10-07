import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // IMPORTANT: payment reservations are never released by a local timer.
  // PENDING participations remain PENDING until Mercado Pago reports a final
  // negative state (failed/canceled/expired). This script only removes expired
  // authentication sessions.
  const sessions = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });

  console.log(`Limpeza concluída: ${sessions.count} sessões expiradas removidas. Reservas de pagamento não foram liberadas por relógio local.`);
}

main()
  .catch((error) => {
    console.error("Falha na limpeza de sessões:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
