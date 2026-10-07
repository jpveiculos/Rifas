import { prisma } from "@/lib/prisma";

const DEFAULT_INSTAGRAM = "rifastop.com.br";

export async function getSiteHeroImage() {
  const rows = await prisma.$queryRaw<Array<{ heroImageUrl: string | null }>>`
    SELECT "heroImageUrl"
    FROM "SiteSettings"
    WHERE id = 1
    LIMIT 1
  `;
  return rows[0]?.heroImageUrl ?? null;
}

export async function ensureSiteInstagramColumn() {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT NOT NULL DEFAULT \'rifastop.com.br\''
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "SiteSettings" ALTER COLUMN "instagramHandle" SET DEFAULT \'rifastop.com.br\''
  );
  await prisma.$executeRawUnsafe(
    'UPDATE "SiteSettings" SET "instagramHandle" = \'rifastop.com.br\' WHERE id = 1 AND "instagramHandle" = \'_rifas.top\''
  );
}

export function cleanInstagramHandle(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/[/?#].*$/, "")
    .trim()
    .slice(0, 60);
}

export async function getSiteInstagramHandle() {
  await ensureSiteInstagramColumn();
  const rows = await prisma.$queryRaw<Array<{ instagramHandle: string }>>`
    SELECT "instagramHandle"
    FROM "SiteSettings"
    WHERE id = 1
    LIMIT 1
  `;
  return cleanInstagramHandle(rows[0]?.instagramHandle || DEFAULT_INSTAGRAM) || DEFAULT_INSTAGRAM;
}
