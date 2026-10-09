import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { DEFAULT_SITE_EDITOR_CONFIG, getSiteEditorConfig, type SiteEditorConfig } from "@/lib/site-editor";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getSiteEditorConfig();
    return NextResponse.json(config, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(DEFAULT_SITE_EDITOR_CONFIG, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const allowed = new Set(["hero", "intro", "raffles", "links"]);
    const order = Array.isArray(body.order)
      ? body.order.filter((item: unknown) => typeof item === "string" && allowed.has(item)).slice(0, 4)
      : DEFAULT_SITE_EDITOR_CONFIG.order;
    for (const item of DEFAULT_SITE_EDITOR_CONFIG.order) {
      if (!order.includes(item)) order.push(item);
    }

    const config: SiteEditorConfig = {
      order,
      visible: {
        hero: body.visible?.hero !== false,
        intro: body.visible?.intro === true,
        raffles: body.visible?.raffles !== false,
        links: body.visible?.links !== false,
      },
      title: String(body.title ?? DEFAULT_SITE_EDITOR_CONFIG.title).trim().slice(0, 100) || DEFAULT_SITE_EDITOR_CONFIG.title,
      subtitle: String(body.subtitle ?? DEFAULT_SITE_EDITOR_CONFIG.subtitle).trim().slice(0, 180),
    };

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SiteEditorConfig" (
        id INTEGER PRIMARY KEY,
        config JSONB NOT NULL,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(
      'INSERT INTO "SiteEditorConfig" (id, config, "updatedAt") VALUES (1, $1::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, "updatedAt" = NOW()',
      JSON.stringify(config)
    );
    return NextResponse.json({ ok: true, config });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar as alterações." }, { status: 500 });
  }
}
