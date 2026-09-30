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

  console.log(`Reservas expiradas liberadas: ${released.count}`);
}

main()
  .catch((error) => {
    console.error("Falha na limpeza de reservas:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
