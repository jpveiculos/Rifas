import { randomBytes, randomInt } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function normalizeRaffleCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
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
        winningNumber: true,
        winningNumbers: true,
        resultStatus: true,
        resultPublishedAt: true,
        createdAt: true
      }
    });

    const confirmedCounts = await prisma.raffleNumber.groupBy({
      by: ["raffleId"],
      where: { status: "CONFIRMED", raffleId: { in: raffles.map((raffle) => raffle.id) } },
      _count: { _all: true }
    });

    const confirmedByRaffle = new Map(
      confirmedCounts.map((item) => [item.raffleId, item._count._all])
    );

    return NextResponse.json({
      raffles: raffles.map((raffle) => ({
        ...raffle,
        confirmedCount: confirmedByRaffle.get(raffle.id) ?? 0
      }))
    });
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
      if (totalNumbers !== current.totalNumbers) return NextResponse.json({ error: "A quantidade de números é fixa depois que a rifa é criada." }, { status: 400 });

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

    if (body.draw === true) {
      if (!id) return NextResponse.json({ error: "Rifa não informada." }, { status: 400 });

      const result = await prisma.$transaction(async (tx) => {
        // Serializa o sorteio desta rifa para impedir dois cliques simultâneos
        // de produzirem dois resultados diferentes.
        await tx.$executeRaw(
          Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${id}))`
        );

        const raffle = await tx.raffle.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            status: true,
            endDate: true,
            resultStatus: true
          }
        });

        if (!raffle) throw new Error("Rifa não encontrada.");
        if (raffle.status !== "ACTIVE") throw new Error("A rifa não está ativa para sorteio.");
        if (raffle.resultStatus === "WINNER") throw new Error("Esta rifa já possui um resultado publicado.");
        if (!raffle.endDate) {
          throw new Error("Defina a data e o horário do sorteio antes de sortear.");
        }
        if (raffle.endDate > new Date()) {
          throw new Error("O sorteio ainda não chegou à data e hora programadas.");
        }

        // Reservas não pagas nunca concorrem: somente CONFIRMED participa.
        await tx.raffleNumber.updateMany({
          where: { raffleId: id, status: "RESERVED" },
          data: {
            status: "AVAILABLE",
            reservationId: null,
            reservedAt: null,
            reservedByUserId: null
          }
        });

        const eligibleCount = await tx.raffleNumber.count({
          where: { raffleId: id, status: "CONFIRMED" }
        });

        if (eligibleCount === 0) throw new Error("Não há nenhum número confirmado para realizar o sorteio.");

        const randomIndex = randomInt(0, eligibleCount);

        const selected = await tx.raffleNumber.findFirst({
          where: { raffleId: id, status: "CONFIRMED" },
          orderBy: { number: "asc" },
          skip: randomIndex,
          select: {
            number: true,
            reservedByUser: {
              select: { id: true, name: true, username: true, whatsapp: true, city: true }
            }
          }
        });

        if (!selected) throw new Error("Não foi possível selecionar o número vencedor.");

        const publishedAt = new Date();
        const updated = await tx.raffle.update({
          where: { id },
          data: {
            status: "ENDED",
            salesClosedAt: publishedAt,
            drawEligibleCount: eligibleCount,
            winningNumbers: [selected.number],
            winningNumber: selected.number,
            resultStatus: "WINNER",
            resultPublishedAt: publishedAt
          },
          select: {
            id: true,
            status: true,
            salesClosedAt: true,
            drawEligibleCount: true,
            winningNumbers: true,
            winningNumber: true,
            resultStatus: true,
            resultPublishedAt: true
          }
        });

        return { ...updated, winner: selected };
      });

      revalidatePath("/");
      revalidatePath("/rifa/" + id);
      revalidatePath("/minha-conta");

      return NextResponse.json({
        ...result,
        message: "Sorteio realizado. A rifa foi finalizada automaticamente.",
        winners: [{
          number: result.winner.number,
          user: result.winner.reservedByUser
        }]
      });
    }

    if (!id || !["ACTIVE", "PAUSED", "ENDED"].includes(status)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    if (status === "ENDED") {
      const result = await prisma.$transaction(async (tx) => {
        await tx.raffleNumber.updateMany({
          where: {
            raffleId: id,
            status: "RESERVED",
            reservedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) }
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

        return tx.raffle.update({
          where: { id },
          data: {
            status: "ENDED",
            salesClosedAt: new Date(),
            drawEligibleCount
          },
          select: { id: true, status: true, salesClosedAt: true, drawEligibleCount: true }
        });
      });

      revalidatePath("/");
      revalidatePath("/rifa/" + id);
      revalidatePath("/minha-conta");

      return NextResponse.json(result);
    }

    const raffle = await prisma.raffle.update({
      where: { id },
      data: { status: status as "ACTIVE" | "PAUSED" }
    });

    revalidatePath("/");
    revalidatePath("/rifa/" + id);
    revalidatePath("/minha-conta");

    return NextResponse.json({ id: raffle.id, status: raffle.status });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Não foi possível alterar a rifa.";
    const clientErrors = [
      "Rifa não encontrada.",
      "A rifa não está ativa para sorteio.",
      "Esta rifa já possui um resultado publicado.",
      "Defina a data e o horário do sorteio antes de sortear.",
      "O sorteio ainda não chegou à data e hora programadas.",
      "Não há nenhum número confirmado para realizar o sorteio.",
      "Não foi possível selecionar o número vencedor."
    ];
    return NextResponse.json(
      { error: clientErrors.includes(message) ? message : "Não foi possível alterar a rifa." },
      { status: clientErrors.includes(message) ? 400 : 500 }
    );
  }
}
