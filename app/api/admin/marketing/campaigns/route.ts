import { createDecipheriv, createHash, randomBytes, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureMarketingTables } from "@/lib/marketing-db";

function decryptMetaToken(value: string) {
  const [ivPart, tagPart, dataPart] = value.split(".");
  const keyRaw = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!ivPart || !tagPart || !dataPart || !keyRaw) throw new Error("Chave de criptografia da Meta não configurada.");
  const key = createHash("sha256").update(keyRaw).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
}
async function metaPost(path: string, token: string, params: Record<string, string>) {
  const version = process.env.META_GRAPH_API_VERSION || "v24.0";
  const url = new URL("https://graph.facebook.com/" + version + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { method: "POST", cache: "no-store" });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || "A Meta recusou a publicação.");
  return data;
}
async function metaGet(path: string, token: string, params: Record<string, string>) {
  const version = process.env.META_GRAPH_API_VERSION || "v24.0";
  const url = new URL("https://graph.facebook.com/" + version + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || "A Meta recusou a consulta.");
  return data;
}
function normalizeMetaCity(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
async function resolveMetaCityKey(city: string, token: string) {
  const data = await metaGet("/search", token, {
    type: "adgeolocation", q: city, location_types: JSON.stringify(["city"]), country_code: "BR",
    fields: "key,name,country_code,region", limit: "20"
  });
  const candidates = Array.isArray(data.data) ? data.data : [];
  const exact = candidates.find((item: any) => normalizeMetaCity(String(item.name || "")) === normalizeMetaCity(city));
  if (!exact?.key) throw new Error("A Meta não encontrou a cidade \"" + city + "\" para segmentação.");
  return String(exact.key);
}
async function publishToMeta(campaignId: string, name: string, budgetCents: number, variants: any[]) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    'SELECT "accessTokenEncrypted","adAccountId","facebookPageId","instagramAccountId" FROM "MetaIntegration" WHERE "id"=1 LIMIT 1'
  );
  const integration = rows[0];
  if (!integration?.accessTokenEncrypted) throw new Error("Conecte a Meta antes de publicar.");
  if (!integration.adAccountId) throw new Error("Selecione a conta de anúncios na integração Meta.");
  if (!integration.facebookPageId) throw new Error("Selecione a página do Facebook na integração Meta.");
  if (!integration.instagramAccountId) throw new Error("Selecione o Instagram na integração Meta.");
  const token = decryptMetaToken(integration.accessTokenEncrypted);
  const accountPath = "/act_" + String(integration.adAccountId).replace(/^act_/, "");
  const sourceImageUrl = variants[0]?.sourceImageUrl;
  if (!sourceImageUrl) throw new Error("A rifa não possui imagem oficial para publicar.");
  const metaCampaign = await metaPost(accountPath + "/campaigns", token, {
    name, objective: "OUTCOME_AWARENESS", status: "ACTIVE", special_ad_categories: "[]",
    daily_budget: String(Math.max(300, Math.round(budgetCents)))
  });
  const metaCampaignId = String(metaCampaign.id);
  await prisma.$executeRawUnsafe(
    'UPDATE "MarketingCampaign" SET "metaCampaignId"=$1,"metaStatus"=\'ACTIVE\',"metaError"=NULL,"metaPublishedAt"=NOW(),"updatedAt"=NOW() WHERE "id"=$2',
    metaCampaignId, campaignId
  );
  const published: any[] = [];
  try {
    for (const variant of variants) {
      const cityKey = await resolveMetaCityKey(variant.city, token);
      const targeting = {
        age_min: 18,
        geo_locations: { cities: [{ key: cityKey }], location_types: ["home"] },
        publisher_platforms: ["facebook", "instagram"],
        facebook_positions: ["feed", "facebook_reels", "story"],
        instagram_positions: ["stream", "reels", "story", "explore"]
      };
      const adSet = await metaPost(accountPath + "/adsets", token, {
        name: name + " • " + variant.city, campaign_id: metaCampaignId,
        optimization_goal: "REACH", billing_event: "IMPRESSIONS",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP", targeting: JSON.stringify(targeting), status: "ACTIVE"
      });
      const adSetId = String(adSet.id);
      await prisma.$executeRawUnsafe('UPDATE "MarketingVariant" SET "metaAdSetId"=$1 WHERE "id"=$2', adSetId, variant.id);
      const objectStorySpec = {
        page_id: integration.facebookPageId,
        instagram_user_id: integration.instagramAccountId,
        link_data: {
          message: variant.caption,
          picture: sourceImageUrl,
          link: "https://rifastop.com.br" + variant.destinationPath,
          call_to_action: { type: "LEARN_MORE" }
        }
      };
      const creative = await metaPost(accountPath + "/adcreatives", token, {
        name: name + " • " + variant.city + " • criativo",
        object_story_spec: JSON.stringify(objectStorySpec)
      });
      const ad = await metaPost(accountPath + "/ads", token, {
        name: name + " • " + variant.city, adset_id: adSetId,
        creative: JSON.stringify({ creative_id: String(creative.id) }), status: "ACTIVE"
      });
      const adId = String(ad.id);
      await prisma.$executeRawUnsafe('UPDATE "MarketingVariant" SET "metaAdId"=$1 WHERE "id"=$2', adId, variant.id);
      published.push({ variantId: variant.id, adSetId, adId });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao criar os anúncios na Meta.";
    await prisma.$executeRawUnsafe(
      'UPDATE "MarketingCampaign" SET "metaStatus"=\'ERROR\',"metaError"=$1,"updatedAt"=NOW() WHERE "id"=$2',
      message.slice(0, 2000), campaignId
    );
    throw new Error("A Meta criou a campanha, mas não conseguiu concluir todos os anúncios: " + message);
  }
  return { metaCampaignId, published };
}

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
             c."destinationType", c."status", c."createdAt", c."updatedAt", c."metaCampaignId", c."metaStatus", c."metaError", c."metaPublishedAt",
             r."productName", r."priceInCents", r."imageUrls",
             COALESCE(json_agg(json_build_object(
               'id', v."id", 'city', v."city", 'distanceKm', v."distanceKm",
               'creativeType', v."creativeType", 'caption', v."caption",
               'trackingCode', v."trackingCode", 'destinationPath', v."destinationPath", 'metaAdSetId', v."metaAdSetId", 'metaAdId', v."metaAdId", 'sourceImageUrl', COALESCE(r."imageUrls"[1], ''),
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

    // Handle special iPhone 15 campaign creation
    if (body?.action === "create-iphone") {
      const IPHONE_CITIES = ["Paramirim", "Érico Cardoso", "Caturama", "Botuporã", "Boquira", "Ibipitanga", "Rio do Pires", "Macaúbas", "Tanque Novo", "Livramento de Nossa Senhora", "Igaporã", "Rio de Contas", "Lagoa Real", "Novo Horizonte", "Caetité"];
      const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Raffle" WHERE "productName" ILIKE '%iPhone 15%' AND "priceInCents" = 100 AND "status" = 'ACTIVE' ORDER BY "createdAt" DESC LIMIT 1`);
      const iphoneRaffle = rows[0];
      if (!iphoneRaffle) return NextResponse.json({ error: "Rifa do iPhone 15 não encontrada" }, { status: 404 });
      const sourceImageUrl = Array.isArray(iphoneRaffle.imageUrls) ? iphoneRaffle.imageUrls[0] : null;
      if (!sourceImageUrl) return NextResponse.json({ error: "Rifa sem imagem" }, { status: 400 });
      const campaignId = randomUUID();
      const iphoneCampaignName = iphoneRaffle.productName + " • " + new Date().toLocaleDateString("pt-BR");
      const iphoneDestinationPath = "/rifa/" + iphoneRaffle.id;
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('INSERT INTO "MarketingCampaign" ("id","name","raffleId","objective","budgetCents","destinationType","status","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())', campaignId, iphoneCampaignName, iphoneRaffle.id, "Alcançar pessoas que ainda não seguem o Instagram", 1000, "RAFFLE", "READY");
        for (const city of IPHONE_CITIES) {
          const variantId = randomUUID();
          await tx.$executeRawUnsafe('INSERT INTO "MarketingVariant" ("id","campaignId","city","distanceKm","creativeType","caption","trackingCode","destinationPath") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', variantId, campaignId, city, 0, "FEED", iphoneRaffle.productName + " - " + city, makeTrackingCode(), iphoneDestinationPath);
          await tx.$executeRawUnsafe('INSERT INTO "MarketingMetric" ("id","variantId","spendCents","impressions","reach","engagements","profileVisits","linkClicks","registrations","participations","updatedAt") VALUES ($1,$2,0,0,0,0,0,0,0,0,NOW())', randomUUID(), variantId);
        }
      });
      return NextResponse.json({ raffleId: iphoneRaffle.id, campaignId, status: "READY", sourceImageUrl, productName: iphoneRaffle.productName, priceInCents: iphoneRaffle.priceInCents, citiesCount: IPHONE_CITIES.length }, { status: 201 });
    }

    const raffleId = String(body.raffleId ?? "").trim();
    const objective = String(body.objective ?? "Alcançar pessoas que ainda não seguem o Instagram").trim().slice(0, 180);
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
    const name = raffle.productName;
    const destinationPath = destinationType === "HOME" ? "/" : "/rifa/" + raffle.id;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'INSERT INTO "MarketingCampaign" ("id","name","raffleId","objective","budgetCents","destinationType","status","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())',
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
          'INSERT INTO "MarketingMetric" ("id","variantId","updatedAt") VALUES ($1,$2,NOW())',
          randomUUID(), variantId
        );
      }
    });

    try {
      const campaignRows = await prisma.$queryRawUnsafe<any[]>(
        'SELECT c."name", c."budgetCents" FROM "MarketingCampaign" c WHERE c."id"=$1 LIMIT 1', id
      );
      const variantRows = await prisma.$queryRawUnsafe<any[]>(
        'SELECT v."id",v."city",v."caption",v."destinationPath",COALESCE(r."imageUrls"[1],\'\') AS "sourceImageUrl" FROM "MarketingVariant" v JOIN "MarketingCampaign" c ON c."id"=v."campaignId" JOIN "Raffle" r ON r."id"=c."raffleId" WHERE v."campaignId"=$1 ORDER BY v."city"', id
      );
      const meta = await publishToMeta(id, campaignRows[0]?.name || raffle.productName, Number(campaignRows[0]?.budgetCents || budgetCents), variantRows);
      return NextResponse.json({ id, ok: true, publishedToMeta: true, metaCampaignId: meta.metaCampaignId, publishedVariants: meta.published.length }, { status: 201 });
    } catch (metaError) {
      const message = metaError instanceof Error ? metaError.message : "Não foi possível publicar na Meta.";
      await prisma.$executeRawUnsafe(
        'UPDATE "MarketingCampaign" SET "metaStatus"=\'ERROR\',"metaError"=$1,"updatedAt"=NOW() WHERE "id"=$2',
        message.slice(0, 2000), id
      );
      return NextResponse.json({ error: message, campaignId: id, publishedToMeta: false }, { status: 502 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível salvar a campanha." }, { status: 500 });
  }
}
