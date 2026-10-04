import { randomBytes, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureMarketingTables } from "@/lib/marketing-db";

// TEMPORARY endpoint: creates the iPhone 15 Pro Max marketing campaign.
// Remove this file after the campaign has been created.

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

function makeTrackingCode() {
  return "rt_" + randomBytes(6).toString("hex");
}

export async function POST() {
  try {
    await ensureMarketingTables();

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "Raffle"
       WHERE "productName" ILIKE '%iPhone 15%'
         AND "priceInCents" = 100
         AND "status" = 'ACTIVE'
       ORDER BY "createdAt" DESC
       LIMIT 1`
    );
    const raffle = rows[0];
    if (!raffle) {
      return NextResponse.json({ error: "Rifa do iPhone 15 Pro Max não encontrada ou inativa" }, { status: 404 });
    }

    const raffleId: string = raffle.id;
    const productName: string = raffle.productName;
    const sourceImageUrl: string | undefined = Array.isArray(raffle.imageUrls) ? raffle.imageUrls[0] : undefined;
    if (!sourceImageUrl) {
      return NextResponse.json({ error: "Esta rifa precisa ter uma imagem cadastrada" }, { status: 400 });
    }

    const campaignId = randomUUID();
    const name = productName + " • " + new Date().toLocaleDateString("pt-BR");
    const destinationPath = "/rifa/" + raffleId;
    const objective = "Alcançar pessoas que ainda não seguem o Instagram";
    const budgetCents = 1000;
    const destinationType = "RAFFLE";
    const creativeType = "FEED";

    const cities = CITIES.map((city) => ({
      city,
      distanceKm: 0,
      caption: productName + " - " + city
    }));

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'INSERT INTO "MarketingCampaign" ("id","name","raffleId","objective","budgetCents","destinationType","status","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())',
        campaignId, name, raffleId, objective, budgetCents, destinationType, "READY"
      );

      for (const item of cities) {
        const variantId = randomUUID();
        await tx.$executeRawUnsafe(
          'INSERT INTO "MarketingVariant" ("id","campaignId","city","distanceKm","creativeType","caption","trackingCode","destinationPath") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          variantId, campaignId, item.city, item.distanceKm, creativeType, item.caption, makeTrackingCode(), destinationPath
        );
        await tx.$executeRawUnsafe(
          'INSERT INTO "MarketingMetric" ("id","variantId","spendCents","impressions","reach","engagements","profileVisits","linkClicks","registrations","participations") VALUES ($1,$2,0,0,0,0,0,0,0,0)',
          randomUUID(), variantId
        );
      }
    });

    return NextResponse.json(
      { raffleId, campaignId, status: "READY", sourceImageUrl, citiesCount: cities.length },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível criar a campanha." }, { status: 500 });
  }
}
