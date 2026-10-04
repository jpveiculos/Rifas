import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureMarketingTables } from "@/lib/marketing-db";

const FIELDS = ["spendCents","impressions","reach","engagements","profileVisits","linkClicks","registrations","participations"] as const;

function intValue(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureMarketingTables();
    const { id } = await context.params;
    const body = await request.json();
    const variantId = String(body.variantId ?? "").trim();
    if (!variantId) return NextResponse.json({ error: "Variação não informada." }, { status: 400 });

    const values = Object.fromEntries(FIELDS.map((field) => [field, intValue(body[field])]));
    await prisma.$executeRawUnsafe(
      'UPDATE "MarketingMetric" SET "spendCents"=$1,"impressions"=$2,"reach"=$3,"engagements"=$4,"profileVisits"=$5,"linkClicks"=$6,"registrations"=$7,"participations"=$8,"updatedAt"=CURRENT_TIMESTAMP WHERE "variantId"=$9 AND "variantId" IN (SELECT "id" FROM "MarketingVariant" WHERE "campaignId"=$10)',
      values.spendCents, values.impressions, values.reach, values.engagements,
      values.profileVisits, values.linkClicks, values.registrations, values.participations,
      variantId, id
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível salvar as métricas." }, { status: 500 });
  }
}
