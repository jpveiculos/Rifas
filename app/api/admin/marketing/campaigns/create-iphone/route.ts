import { randomBytes, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureMarketingTables } from "@/lib/marketing-db";

const CITIES = [
  "Paramirim", "Érico Cardoso", "Caturama", "Botuporã", "Boquira",
  "Ibipitanga", "Rio do Pires", "Macaúbas", "Tanque Novo",
  "Livramento de Nossa Senhora", "Igaporã", "Rio de Contas",
  "Lagoa Real", "Novo Horizonte", "Caetité"
];

function makeTrackingCode() {
  return "rt_" + randomBytes(6).toString("hex");
}

export async function POST() {
  try {
    await ensureMarketingTables();

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "Raffle" WHERE "productName" ILIKE '%iPhone 15%' AND "priceInCents" = 100 AND "status" = 'ACTIVE' ORDER BY "createdAt" DESC LIMIT 1`
    );

    const raffle = rows[0];
    if (!raffle) return NextResponse.json({ error: "Rifa não encontrada" }, { status: 404 });

    const raffleId = raffle.id;
    const sourceImageUrl = Array.isArray(raffle.imageUrls) ? raffle.imageUrls[0] : null;
    if (!sourceImageUrl) return NextResponse.json({ error: "Rifa sem imagem" }, { status: 400 });

    const campaignId = randomUUID();
    const name = raffle.productName + " • " + new Date().toLocaleDateString("pt-BR");
    const destinationPath = "/rifa/" + raffleId;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'INSERT INTO "MarketingCampaign" ("id","name","raffleId","objective","budgetCents","destinationType","status","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())',
        campaignId, name, raffleId, "Alcançar pessoas que ainda não seguem o Instagram", 1000, "RAFFLE", "READY"
      );

      for (const city of CITIES) {
        const variantId = randomUUID();
        await tx.$executeRawUnsafe(
          'INSERT INTO "MarketingVariant" ("id","campaignId","city","distanceKm","creativeType","caption","trackingCode","destinationPath") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          variantId, campaignId, city, 0, "FEED", raffle.productName + " - " + city, makeTrackingCode(), destinationPath
        );
        await tx.$executeRawUnsafe(
          'INSERT INTO "MarketingMetric" ("id","variantId","spendCents","impressions","reach","engagements","profileVisits","linkClicks","registrations","participations") VALUES ($1,$2,0,0,0,0,0,0,0,0)',
          randomUUID(), variantId
        );
      }
    });

    return NextResponse.json(
      {
        raffleId,
        campaignId,
        status: "READY",
        sourceImageUrl,
        productName: raffle.productName,
        priceInCents: raffle.priceInCents,
        citiesCount: CITIES.length
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar campanha" }, { status: 500 });
  }
}
