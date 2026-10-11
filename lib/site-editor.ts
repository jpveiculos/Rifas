import { prisma } from "@/lib/prisma";

export type SiteEditorConfig = {
  order: string[];
  visible: { hero: boolean; intro: boolean; raffles: boolean; links: boolean };
  title: string;
  subtitle: string;
};

export const DEFAULT_SITE_EDITOR_CONFIG: SiteEditorConfig = {
  order: ["hero", "intro", "raffles", "links"],
  visible: { hero: true, intro: false, raffles: true, links: true },
  title: "Rifas em Paramirim-BA e Região",
  subtitle: "Encontre sua próxima chance de ganhar.",
};

export async function getSiteEditorConfig(): Promise<SiteEditorConfig> {
  // A tabela é criada apenas quando o administrador salva pela primeira vez.
  // A página pública usa a configuração padrão enquanto ela ainda não existe.
  const rows = await prisma.$queryRawUnsafe<Array<{ config: SiteEditorConfig }>>(
    'SELECT config FROM "SiteEditorConfig" WHERE id = 1'
  );
  if (!rows.length) {
    await prisma.$executeRawUnsafe(
      'INSERT INTO "SiteEditorConfig" (id, config) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',
      JSON.stringify(DEFAULT_SITE_EDITOR_CONFIG)
    );
    return DEFAULT_SITE_EDITOR_CONFIG;
  }
  const saved = rows[0].config as SiteEditorConfig;
  return {
    ...DEFAULT_SITE_EDITOR_CONFIG,
    ...saved,
    visible: { ...DEFAULT_SITE_EDITOR_CONFIG.visible, ...(saved.visible ?? {}) },
    order: Array.isArray(saved.order) ? saved.order : DEFAULT_SITE_EDITOR_CONFIG.order,
  };
}
