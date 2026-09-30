import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function normalizeRaffleCode(value: string) {
  return value.trim().toUpperCase().replace(/\\s+/g, "-");
}

async function generateRaffleCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = "RIFA-" + randomBytes(4).toString("hex").toUpperCase();
    const exists = await prisma.raffle.findUnique({ where: { raffleCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("Não foi possível gerar um ID único para a rifa.");
}

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
        raffleCode: true,
        name: true,
        productName: true,
        totalNumbers: true,
        priceInCents: true,
        endDate: true,
        status: true,
        salesClosedAt: true,
        drawEligibleCount: true,
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
    const raffleCodeInput = normalizeRaffleCode(String(body.raffleCode ?? ""));
    const name = String(body.raffleName ?? "").trim();
    const productName = String(body.productName ?? "").trim();
    const description = String(body.description ?? "").trim();
    const totalNumbers = Number(body.totalNumbers);
    const priceInCents = parsePrice(String(body.pricePerNumber ?? ""));
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map((value: unknown) => String(value).trim()).filter(Boolean).slice(0, 10) : [];
    const rawEndDate = String(body.endDate ?? "").trim();
    const endDate = rawEndDate ? new Date(rawEndDate) : null;

    if (raffleCodeInput && !/^[A-Z0-9-]{3,30}$/.test(raffleCodeInput)) return NextResponse.json({ error: "O ID da rifa deve ter de 3 a 30 caracteres, usando apenas letras, números e hífen." }, { status: 400 });

    if (!name || !productName || !description || !Number.isInteger(totalNumbers) || totalNumbers < 1 || totalNumbers > 1_000_000 || !priceInCents || (endDate && Number.isNaN(endDate.getTime()))) {
      return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
    }

    if (endDate && endDate <= new Date()) {
      return NextResponse.json({ error: "A data de encerramento precisa ser futura." }, { status: 400 });
    }

    const raffleCode = raffleCodeInput || await generateRaffleCode();

    const raffle = await prisma.$transaction(async (tx) => {
      const created = await tx.raffle.create({
        data: { raffleCode, name, productName, description, imageUrls, totalNumbers, priceInCents, endDate }
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
    const isEdit = Boolean(body.edit);

    if (isEdit) {
      const raffleCodeInput = normalizeRaffleCode(String(body.raffleCode ?? ""));
      const name = String(body.raffleName ?? "").trim();
      const productName = String(body.productName ?? "").trim();
      const description = String(body.description ?? "").trim();
      const totalNumbers = Number(body.totalNumbers);
      const priceInCents = parsePrice(String(body.pricePerNumber ?? ""));
      const rawEndDate = String(body.endDate ?? "").trim();
      const endDate = rawEndDate ? new Date(rawEndDate) : null;
      const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map((value: unknown) => String(value).trim()).filter(Boolean).slice(0, 10) : [];

      if (raffleCodeInput && !/^[A-Z0-9-]{3,30}$/.test(raffleCodeInput)) return NextResponse.json({ error: "O ID da rifa deve ter de 3 a 30 caracteres, usando apenas letras, números e hífen." }, { status: 400 });

      if (!id || !name || !productName || !description || !Number.isInteger(totalNumbers) || totalNumbers < 1 || totalNumbers > 1_000_000 || !priceInCents || (endDate && Number.isNaN(endDate.getTime()))) {
        return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
      }
      if (endDate && endDate <= new Date()) return NextResponse.json({ error: "A data do sorteio precisa ser futura." }, { status: 400 });

      const current = await prisma.raffle.findUnique({ where: { id }, select: { totalNumbers: true } });
      if (!current) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });

      if (totalNumbers !== current.totalNumbers) {
        return NextResponse.json({ error: "A quantidade de números é fixa depois que a rifa é criada." }, { status: 400 });
      }

      const raffleCode = raffleCodeInput || (await prisma.raffle.findUnique({ where: { id }, select: { raffleCode: true } }))?.raffleCode;
      if (!raffleCode) return NextResponse.json({ error: "ID da rifa não encontrado." }, { status: 400 });

      const duplicate = await prisma.raffle.findFirst({ where: { raffleCode, NOT: { id } }, select: { id: true } });
      if (duplicate) return NextResponse.json({ error: "Esse ID de rifa já está sendo usado. Escolha outro." }, { status: 409 });

      await prisma.raffle.update({
        where: { id },
        data: { raffleCode, name, productName, description, priceInCents, endDate, imageUrls }
      });
      return NextResponse.json({ id, ok: true });
    }


    if (!id || !["ACTIVE", "PAUSED", "ENDED"].includes(status)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    if (status === "ENDED") {
      const result = await prisma.$transaction(async (tx) => {
        const reservationLimit = new Date(Date.now() - 30 * 60 * 1000);
        await tx.raffleNumber.updateMany({
          where: {
            raffleId: id,
            status: "RESERVED",
            reservedAt: { lt: reservationLimit }
          },
          data: {
            status: "AVAILABLE",
            reservationId: null,
            reservedAt: null,
            reservedByUserId: null
          }
        });

        await tx.raffleNumber.updateMany({
          where: { raffleId: id, status: "RESERVED" },
          data: {
            status: "AVAILABLE",
            reservationId: null,
            reservedAt: null,
            reservedByUserId: null
          }
        });

        const drawEligibleCount = await tx.raffleNumber.count({
          where: { raffleId: id, status: "CONFIRMED" }
        });

        const raffle = await tx.raffle.update({
          where: { id },
          data: {
            status: "ENDED",
            salesClosedAt: new Date(),
            drawEligibleCount
          },
          select: { id: true, status: true, salesClosedAt: true, drawEligibleCount: true }
        });

        return raffle;
      });

      return NextResponse.json(result);
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