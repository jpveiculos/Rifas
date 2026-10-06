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

    const isAlreadyRenumbered =
      raffle.totalNumbers === 10000 &&
      count === 10000 &&
      min === 0 &&
      max === 9999;

    if (isAlreadyRenumbered) {
      await prisma.raffle.update({
        where: { id: raffle.id },
        data: { totalNumbers: 9999 }
      });
      migrated += 1;
      console.log(`Faixa corrigida: ${raffle.productName} (${raffle.id})`);
      continue;
    }

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

      // 10.000 posições passam a representar exatamente 0000..9999.
      // O 10.000 antigo vira 9999 e não deve mais existir como faixa.
      await tx.raffle.update({
        where: { id: raffle.id },
        data: { totalNumbers: 9999 }
      });
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
