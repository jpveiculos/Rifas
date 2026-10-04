import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ensureMarketingTables } from "@/lib/marketing-db";

const IPHONE_CITIES = [
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

const CAMPAIGN_OBJECTIVE = "Alcançar pessoas que ainda não seguem o Instagram";

export type InitIphoneCampaignResult =
  | { created: true; raffleId: string; campaignId: string; status: "READY" }
  | { created: false; reason: "ALREADY_EXISTS" | "RAFFLE_NOT_FOUND" | "ERROR" };

let initPromise: Promise<InitIphoneCampaignResult> | null = null;

async function run(): Promise<InitIphoneCampaignResult> {
  await ensureMarketingTables();

  const existing = await prisma.$queryRawUnsafe<{ count: bigint | number }[]>(
    'SELECT COUNT(*) AS "count" FROM "MarketingCampaign" c JOIN "Raffle" r ON r."id" = c."raffleId" WHERE r."productName" ILIKE \'%iPhone 15%\''
  );
  if (Number(existing[0]?.count ?? 0) > 0) {
    return { created: false, reason: "ALREADY_EXISTS" };
  }

  const raffles = await prisma.$queryRawUnsafe<{ id: string; productName: string }[]>(
    'SELECT "id", "productName" FROM "Raffle" WHERE "productName" ILIKE \'%iPhone 15%\' AND "priceInCents" = 100 AND "status"::text = \'ACTIVE\' ORDER BY "createdAt" DESC LIMIT 1'
  );
  const raffle = raffles[0];
  if (!raffle) {
    console.warn("⚠️ iPhone 15 campaign not created: no active raffle found (productName ILIKE '%iPhone 15%', priceInCents=100).");
    return { created: false, reason: "RAFFLE_NOT_FOUND" };
  }

  const campaignId = randomUUID();
  const destinationPath = "/rifa/" + raffle.id;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      'INSERT INTO "MarketingCampaign" ("id","name","raffleId","objective","budgetCents","destinationType","status") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      campaignId,
      raffle.productName + " • Campanha inicial",
      raffle.id,
      CAMPAIGN_OBJECTIVE,
      0,
      "RAFFLE",
      "READY"
    );

    for (const city of IPHONE_CITIES) {
      const variantId = randomUUID();
      const trackingCode = "rt_" + randomBytes(6).toString("hex");
      const caption = `Concorra ao ${raffle.productName} em ${city}! Participe pelo link e garanta seus números.`;
      await tx.$executeRawUnsafe(
        'INSERT INTO "MarketingVariant" ("id","campaignId","city","distanceKm","creativeType","caption","trackingCode","destinationPath") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        variantId,
        campaignId,
        city,
        0,
        "SITE",
        caption,
        trackingCode,
        destinationPath
      );
      await tx.$executeRawUnsafe(
        'INSERT INTO "MarketingMetric" ("id","variantId") VALUES ($1,$2)',
        randomUUID(),
        variantId
      );
    }
  });

  console.log(`✅ iPhone 15 campaign created: raffleId=${raffle.id}, campaignId=${campaignId}, status=READY`);
  return { created: true, raffleId: raffle.id, campaignId, status: "READY" };
}

/**
 * Creates the iPhone 15 marketing campaign once, if it does not exist yet.
 * Never throws: failures are logged and reported in the result so the app keeps running.
 * The in-process promise is reused only after a definitive outcome; a missing raffle or
 * an error allows a later retry.
 */
export function initializeIphoneCampaign(): Promise<InitIphoneCampaignResult> {
  if (initPromise) return initPromise;

  const current = run().catch((error): InitIphoneCampaignResult => {
    console.error("iPhone 15 campaign initialization failed:", error);
    return { created: false, reason: "ERROR" };
  });
  initPromise = current;

  current.then((result) => {
    if (!result.created && result.reason !== "ALREADY_EXISTS" && initPromise === current) {
      initPromise = null;
    }
  });

  return current;
}
