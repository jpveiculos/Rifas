import { randomBytes, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureMarketingTables } from "@/lib/marketing-db";

const ALLOWED_CREATIVES = new Set(["SITE", "PRODUCT", "STORY", "FEED"]);
const ALLOWED_DESTINATIONS = new Set(["HOME", "RAFFLE"]);

function cleanCity(value: unknown) {
  return String(value ?? "").trim().slice(0, 100);
}

function moneyToCents(value: unknown) {
  const normalized = String(value ?? "").replace(/\./g, "").replace(",", ".").trim();
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) return null;
  return Math.round(amount * 100);
}

function makeTrackingCode() {
  return "rt_" + randomBytes(6).toString("hex");
}

export async function GET() {
  try {
    await ensureMarketingTables();
    const sql = `
      SELECT c."id", c."name", c."raffleId", c."objective", c."budgetCents",
             c."destinationType", c."status", c."createdAt", c."updatedAt",
             r."productName", r."priceInCents", r."imageUrls",
             COALESCE(json_agg(json_build_object(
               'id', v."id", 'city', v."city", 'distanceKm', v."distanceKm",
               'creativeType', v."creativeType", 'caption', v."caption",
               'trackingCode', v."trackingCode", 'destinationPath', v."destinationPath", 'sourceImageUrl', COALESCE(r."imageUrls"->>0, ''),
               'metrics', json_build_object(
                 'spendCents', COALESCE(m."spendCents",0),
                 'impressions', COALESCE(m."impressions",0),
                 'reach', COALESCE(m."reach",0),
                 'engagements', COALESCE(m."engagements",0),
                 'profileVisits', COALESCE(m."profileVisits",0),
                 'linkClicks', COALESCE(m."linkClicks",0),
                 'registrations', COALESCE(m."registrations",0),
                 'participations', COALESCE(m."participations",0),
                 'trackedClicks', (SELECT COUNT(*) FROM "MarketingClick" mc WHERE mc."trackingCode" = v."trackingCode")
               )
             ) ORDER BY v."city") FILTER (WHERE v."id" IS NOT NULL), '[]') AS "variants"
      FROM "MarketingCampaign" c
      JOIN "Raffle" r ON r."id" = c."raffleId"
      LEFT JOIN "MarketingVariant" v ON v."campaignId" = c."id"
      LEFT JOIN "MarketingMetric" m ON m."variantId" = v."id"
      GROUP BY c."id", r."productName", r."priceInCents", r."imageUrls"
      ORDER BY c."createdAt" DESC
      LIMIT 30
    `;
    const rows = await prisma.$queryRawUnsafe<any[]>(sql);
    return NextResponse.json({ campaigns: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar as campanhas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureMarketingTables();
    const body = await request.json();
    const raffleId = String(body.raffleId ?? "").trim();
    const objective = String(body.objective ?? "Alcançar pessoas que ainda não seguem o Instagram").trim().slice(0, 180);
    const campaignName = String(body.name ?? "").trim().slice(0, 120);
    const destinationType = String(body.destinationType ?? "RAFFLE").toUpperCase();
    const budgetCents = moneyToCents(body.budget);
    const creativeType = String(body.creativeType ?? "SITE").toUpperCase();
    const cities = Array.isArray(body.cities)
      ? body.cities.map((item: any) => ({
          city: cleanCity(item?.city),
          distanceKm: Number(item?.distanceKm ?? 0),
          caption: String(item?.caption ?? "").trim().slice(0, 5000)
        })).filter((item: any) => item.city && item.caption)
      : [];

    if (!raffleId) return NextResponse.json({ error: "Selecione uma rifa." }, { status: 400 });
    if (!cities.length) return NextResponse.json({ error: "Selecyone pelo menos uma cidade." }, { status: 400 });
    if (budgetCents === null) return NextResponse.json({ error: "Informe um orçamento válido." }, { status: 400 });
    if (!ALLOWED_CREATIVES.has(creativeType)) return NextResponse.json({ error: "Tipo de criativo inválido." }, { status: 400 });
    if (!ALLOWED_DESTINATIONS.has(destinationType)) return NextResponse.json({ error: "Destino inválido." }, { status: 400 });

    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
      select: { id: true, productName: true, imageUrls: true }
    });
    if (!raffle) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
    if (!Array.isArray(raffle.imageUrls) || !raffle.imageUrls[0]) {
      return NextResponse.json({ error: "Esta rifa precisa ter uma imagem cadastrada. Use uma única imagem como fonte dos criativos." }, { status: 400 });
    }

    const id = randomUUID();
    const name = campaignName || raffle.productName + " • " + new Date().toLocaleDateString("pt-BR");
    const destinationPath = destinationType === "HOME" ? "/" : "/rifa/" + raffle.id;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'INSERT INTO "MarketingCampaign" ("id","name","raffleId","objective","budgetCents","destinationType","status") VALUES ($1,$2,$3,$4,$5,$6,$7)',
        id, name, raffleId, objective, budgetCents, destinationType, "READY"
      );

      for (const item of cities) {
        const trackingCode = makeTrackingCode();
        const variantId = randomUUID();
        await tx.$executeRawUnsafe(
          'INSERT INTO "MarketingVariant" ("id","campaignId","city","distanceKm","creativeType","caption","trackingCode","destinationPath") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          variantId, id, item.city, Number.isFinite(item.distanceKm) ? item.distanceKm : 0,
          creativeType, item.caption, trackingCode, destinationPath
        );
        await tx.$executeRawUnsafe(
          'INSERT INTO "MarketingMetric" ("id","variantId") VALUES ($1,$2)',
          randomUUID(), variantId
        );
      }
    });

    return NextResponse.json({ id, ok: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível salvar a campanha." }, { status: 500 });
  }
}
