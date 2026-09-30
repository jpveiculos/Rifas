import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parsePrice(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export async function GET() {
  try {
    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        productName: true,
        totalNumbers: true,
        priceInCents: true,
        endDate: true,
        status: true,
        createdAt: true
      }
    });
    return NextResponse.json({ raffles });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível carregar as rifas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.raffleName ?? "").trim();
    const productName = String(body.productName ?? "").trim();
    const description = String(body.description ?? "").trim();
    const totalNumbers = Number(body.totalNumbers);
    const priceInCents = parsePrice(String(body.pricePerNumber ?? ""));
    const rawEndDate = String(body.endDate ?? "").trim();
    const endDate = rawEndDate ? new Date(rawEndDate) : null;

    if (!name || !productName || !description || !Number.isInteger(totalNumbers) || totalNumbers < 1 || totalNumbers > 1_000_000 || !priceInCents || (endDate && Number.isNaN(endDate.getTime()))) {
      return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
    }

    if (endDate && endDate <= new Date()) {
      return NextResponse.json({ error: "A data de encerramento precisa ser futura." }, { status: 400 });
    }

    const raffle = await prisma.$transaction(async (tx) => {
      const created = await tx.raffle.create({
        data: { name, productName, description, totalNumbers, priceInCents, endDate }
      });

      await tx.$executeRaw(
        Prisma.sql`
          INSERT INTO "RaffleNumber" ("id", "raffleId", "number")
          SELECT md5(${created.id} || ':' || series::text), ${created.id}, series
          FROM generate_series(1, ${totalNumbers}) AS series
        `
      );

      return created;
    });

    return NextResponse.json({ id: raffle.id, status: raffle.status }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível salvar a rifa." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    const status = String(body.status ?? "");
    const isEdit = Boolean(body.edit);\n\n    if (isEdit) {\n      const name = String(body.raffleName ?? "").trim();\n      const productName = String(body.productName ?? "").trim();\n      const description = String(body.description ?? "").trim();\n      const totalNumbers = Number(body.totalNumbers);\n      const priceInCents = parsePrice(String(body.pricePerNumber ?? ""));\n      const rawEndDate = String(body.endDate ?? "").trim();\n      const endDate = rawEndDate ? new Date(rawEndDate) : null;\n      const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map((value: unknown) => String(value).trim()).filter(Boolean).slice(0, 10) : [];\n\n      if (!id || !name || !productName || !description || !Number.isInteger(totalNumbers) || totalNumbers < 1 || totalNumbers > 1_000_000 || !priceInCents || (endDate && Number.isNaN(endDate.getTime()))) {\n        return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });\n      }\n      if (endDate && endDate <= new Date()) return NextResponse.json({ error: "A data do sorteio precisa ser futura." }, { status: 400 });\n\n      const current = await prisma.raffle.findUnique({ where: { id }, select: { totalNumbers: true } });\n      if (!current) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });\n\n      if (totalNumbers !== current.totalNumbers) {\n        const occupied = await prisma.raffleNumber.count({ where: { raffleId: id, status: { not: "AVAILABLE" } } });\n        if (occupied > 0) return NextResponse.json({ error: "A quantidade de números não pode ser alterada depois que houver números reservados ou confirmados." }, { status: 400 });\n        if (totalNumbers < current.totalNumbers) return NextResponse.json({ error: "A quantidade de números só pode ser reduzida criando uma nova rifa." }, { status: 400 });\n        await prisma.$transaction(async (tx) => {\n          await tx.raffle.update({ where: { id }, data: { name, productName, description, totalNumbers, priceInCents, endDate, imageUrls } });\n          await tx.$executeRaw(Prisma.sql`INSERT INTO "RaffleNumber" ("id", "raffleId", "number") SELECT md5(${id} || ':' || series::text), ${id}, series FROM generate_series(${current.totalNumbers + 1}, ${totalNumbers}) AS series`);\n        });\n      } else {\n        await prisma.raffle.update({ where: { id }, data: { name, productName, description, priceInCents, endDate, imageUrls } });\n      }\n      return NextResponse.json({ id, ok: true });\n    }\n

    if (!id || !["ACTIVE", "PAUSED", "ENDED"].includes(status)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const raffle = await prisma.raffle.update({
      where: { id },
      data: { status: status as "ACTIVE" | "PAUSED" | "ENDED" }
    });

    return NextResponse.json({ id: raffle.id, status: raffle.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível alterar a rifa." }, { status: 500 });
  }
}