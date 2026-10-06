import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const raffles = await prisma.raffle.findMany({
    select: { id: true, totalNumbers: true, productName: true }
  });

  let migrated = 0;

  for (const raffle of raffles) {
    const stats = await prisma.raffleNumber.aggregate({
      where: { raffleId: raffle.id },
      _count: { _all: true },
      _min: { number: true },
      _max: { number: true }
    });

    const count = stats._count._all;
    const min = stats._min.number;
    const max = stats._max.number;

    const isLegacy =
      count === raffle.totalNumbers &&
      min === 1 &&
      max === raffle.totalNumbers;

    if (!isLegacy) continue;

    await prisma.$transaction(async (tx) => {
      // Temporarily move the values away from the unique (raffleId, number)
      // range so the conversion 1..N -> 0..N-1 cannot collide.
      await tx.$executeRawUnsafe(
        `UPDATE "RaffleNumber"
         SET "number" = "number" + 1000001
         WHERE "raffleId" = $1`,
        raffle.id
      );

      await tx.$executeRawUnsafe(
        `UPDATE "RaffleNumber"
         SET "number" = "number" - 1000002
         WHERE "raffleId" = $1`,
        raffle.id
      );
    });

    migrated += 1;
    console.log(`Rifa normalizada: ${raffle.productName} (${raffle.id})`);
  }

  console.log(`Normalização concluída. Rifas migradas: ${migrated}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
