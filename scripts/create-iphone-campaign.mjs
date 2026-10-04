import { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID } from "crypto";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const OBJECTIVE = "Alcançar pessoas que ainda não seguem o Instagram";
const DESTINATION_TYPE = "RAFFLE";
const CREATIVE_TYPE = "FEED";
const BUDGET_CENTS = 1000;

const CITIES = [
  "Paramirim",
  "Érico Cardoso",
  "Caturama",
  "Botuporã",
  "Boquira",
  "Ibipitanga",
  "Rio do Pires",
  "Macaúbas",
  "Tanque Novo",
  "Livramento de Nossa Senhora",
  "Igaporã",
  "Rio de Contas",
  "Lagoa Real",
  "Novo Horizonte",
  "Caetité"
];

// Mesma lógica de lib/marketing-db.ts
async function ensureMarketingTables() {
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "MarketingCampaign" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "raffleId" TEXT NOT NULL, "objective" TEXT NOT NULL, "budgetCents" INTEGER NOT NULL DEFAULT 0, "destinationType" TEXT NOT NULL DEFAULT \'HOME\', "status" TEXT NOT NULL DEFAULT \'READY\', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MarketingCampaign_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE)'
  );
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "MarketingVariant" ("id" TEXT PRIMARY KEY, "campaignId" TEXT NOT NULL, "city" TEXT NOT NULL, "distanceKm" INTEGER NOT NULL DEFAULT 0, "creativeType" TEXT NOT NULL DEFAULT \'SITE\', "caption" TEXT NOT NULL, "trackingCode" TEXT NOT NULL UNIQUE, "destinationPath" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MarketingVariant_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE)'
  );
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "MarketingMetric" ("id" TEXT PRIMARY KEY, "variantId" TEXT NOT NULL UNIQUE, "spendCents" INTEGER NOT NULL DEFAULT 0, "impressions" INTEGER NOT NULL DEFAULT 0, "reach" INTEGER NOT NULL DEFAULT 0, "engagements" INTEGER NOT NULL DEFAULT 0, "profileVisits" INTEGER NOT NULL DEFAULT 0, "linkClicks" INTEGER NOT NULL DEFAULT 0, "registrations" INTEGER NOT NULL DEFAULT 0, "participations" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MarketingMetric_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "MarketingVariant"("id") ON DELETE CASCADE)'
  );
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "MarketingClick" ("id" TEXT PRIMARY KEY, "trackingCode" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "referrer" TEXT, "userAgent" TEXT)'
  );
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "MarketingCampaign_raffleId_idx" ON "MarketingCampaign"("raffleId")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "MarketingVariant_campaignId_idx" ON "MarketingVariant"("campaignId")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "MarketingClick_trackingCode_idx" ON "MarketingClick"("trackingCode")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "MarketingClick_createdAt_idx" ON "MarketingClick"("createdAt")');
}

function makeTrackingCode() {
  return "rt_" + randomBytes(6).toString("hex");
}

function parseImageUrls(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não está definida.");
  }

  await ensureMarketingTables();

  const raffles = await prisma.$queryRawUnsafe(
    'SELECT * FROM "Raffle" WHERE "productName" ILIKE \'%iPhone 15%\' AND "priceInCents" = 100 AND "status" = \'ACTIVE\' ORDER BY "createdAt" DESC LIMIT 1'
  );

  if (!raffles.length) {
    console.error('Nenhuma rifa ativa encontrada com "iPhone 15" e preço de R$ 1,00 por número.');
    process.exitCode = 1;
    return null;
  }

  const raffle = raffles[0];
  const raffleId = raffle.id;
  const productName = raffle.productName;
  const sourceImageUrl = parseImageUrls(raffle.imageUrls)[0];

  if (!sourceImageUrl) {
    console.error("A rifa encontrada (" + raffleId + ") não possui imagem cadastrada.");
    process.exitCode = 1;
    return null;
  }

  const cities = CITIES.map((city) => ({
    city,
    distanceKm: 0,
    caption: productName + " - " + city
  }));

  const campaignId = randomUUID();
  const now = new Date();
  const name = productName + " • " + now.toLocaleDateString("pt-BR");
  const destinationPath = "/rifa/" + raffleId;
  const confirmations = [];

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      'INSERT INTO "MarketingCampaign" ("id","name","raffleId","objective","budgetCents","destinationType","status","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      campaignId, name, raffleId, OBJECTIVE, BUDGET_CENTS, DESTINATION_TYPE, "READY", now, now
    );

    for (const item of cities) {
      const variantId = randomUUID();
      const trackingCode = makeTrackingCode();

      await tx.$executeRawUnsafe(
        'INSERT INTO "MarketingVariant" ("id","campaignId","city","distanceKm","creativeType","caption","trackingCode","destinationPath") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        variantId, campaignId, item.city, item.distanceKm, CREATIVE_TYPE, item.caption, trackingCode, destinationPath
      );

      await tx.$executeRawUnsafe(
        'INSERT INTO "MarketingMetric" ("id","variantId","spendCents","impressions","reach","engagements","profileVisits","linkClicks","registrations","participations") VALUES ($1,$2,0,0,0,0,0,0,0,0)',
        randomUUID(), variantId
      );

      confirmations.push("✔ " + item.city + " | variante " + variantId + " | " + trackingCode);
    }
  });

  const result = { raffleId, campaignId, sourceImageUrl, status: "READY" };

  console.log("raffleId: " + result.raffleId);
  console.log("campaignId: " + result.campaignId);
  console.log("status: " + result.status);
  confirmations.forEach((line) => console.log(line));

  return result;
}

main()
  .catch((error) => {
    console.error("Falha ao criar a campanha do iPhone:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
