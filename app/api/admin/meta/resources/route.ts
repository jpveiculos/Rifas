import { createDecipheriv, createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function decrypt(value: string) {
  const [ivPart, tagPart, dataPart] = value.split(".");
  const keyRaw = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!ivPart || !tagPart || !dataPart || !keyRaw) throw new Error("Chave de criptografia da Meta não configurada.");
  const key = createHash("sha256").update(keyRaw).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "accessTokenEncrypted" FROM "MetaIntegration" WHERE "id"=1 LIMIT 1`
    );
    if (!rows[0]?.accessTokenEncrypted) return NextResponse.json({ error: "Conecte a Meta primeiro." }, { status: 400 });

    const token = decrypt(rows[0].accessTokenEncrypted);
    const version = process.env.META_GRAPH_API_VERSION || "v24.0";
    const graph = async (path: string, fields: string) => {
      const url = new URL("https://graph.facebook.com/" + version + path);
      url.searchParams.set("fields", fields);
      url.searchParams.set("limit", "100");
      url.searchParams.set("access_token", token);
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "A Meta recusou a consulta.");
      return data.data || [];
    };

    const [adAccounts, pages] = await Promise.all([
      graph("/me/adaccounts", "id,name,account_status,currency,timezone_name"),
      graph("/me/accounts", "id,name,instagram_business_account{id,username}")
    ]);

    return NextResponse.json({
      adAccounts: adAccounts.map((item: any) => ({
        id: item.id, name: item.name, accountStatus: item.account_status,
        currency: item.currency, timezone: item.timezone_name
      })),
      pages: pages.map((item: any) => ({
        id: item.id, name: item.name,
        instagram: item.instagram_business_account
          ? { id: item.instagram_business_account.id, username: item.instagram_business_account.username }
          : null
      }))
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Não foi possível carregar os recursos da Meta." }, { status: 502 });
  }
}
