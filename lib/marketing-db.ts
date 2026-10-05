import { prisma } from "@/lib/prisma";

let ensured = false;

export async function ensureMarketingTables() {
  if (ensured) return;
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
  await prisma.$executeRawUnsafe('ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "metaCampaignId" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "metaStatus" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "metaError" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "MarketingCampaign" ADD COLUMN IF NOT EXISTS "metaPublishedAt" TIMESTAMPTZ');
  await prisma.$executeRawUnsafe('ALTER TABLE "MarketingVariant" ADD COLUMN IF NOT EXISTS "metaAdSetId" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "MarketingVariant" ADD COLUMN IF NOT EXISTS "metaAdId" TEXT');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "MarketingCampaign_raffleId_idx" ON "MarketingCampaign"("raffleId")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "MarketingVariant_campaignId_idx" ON "MarketingVariant"("campaignId")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "MarketingClick_trackingCode_idx" ON "MarketingClick"("trackingCode")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "MarketingClick_createdAt_idx" ON "MarketingClick"("createdAt")');
  ensured = true;
}

export type MarketingMetricRow = {
  spendCents: number;
  impressions: number;
  reach: number;
  engagements: number;
  profileVisits: number;
  linkClicks: number;
  registrations: number;
  participations: number;
};

export function toMetric(row?: Partial<MarketingMetricRow> | null): MarketingMetricRow {
  return {
    spendCents: Number(row?.spendCents ?? 0),
    impressions: Number(row?.impressions ?? 0),
    reach: Number(row?.reach ?? 0),
    engagements: Number(row?.engagements ?? 0),
    profileVisits: Number(row?.profileVisits ?? 0),
    linkClicks: Number(row?.linkClicks ?? 0),
    registrations: Number(row?.registrations ?? 0),
    participations: Number(row?.participations ?? 0)
  };
}
