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

function normalizeTopicName(value: string) {
  return value
    .trim()
    .replace(/^rifas\s+em\s+/i, "")
    .replace(/\s+/g, " ");
}

function normalizeTopicKey(value: string) {
  return normalizeTopicName(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function parsePrice(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export async function GET() {
  try {
    await prisma.$transaction(async (tx) => {
      const allTopics = await tx.raffleTopic.findMany({
        select: { id: true, name: true, normalized: true }
      });

      const hasLegacyTopic = allTopics.some((topic) =>
        topic.normalized.startsWith("botupora") ||
        topic.normalized === "paramirim"
      );
      const hasLegacyRaffle = await tx.raffle.findFirst({
        where: {
          OR: [
            { city: { startsWith: "Botuporã", mode: "insensitive" } },
            { city: { startsWith: "Paramirim", mode: "insensitive" }, topicId: null }
          ]
        },
        select: { id: true }
      });

      if (!hasLegacyTopic && !hasLegacyRaffle && allTopics.length > 0) return;

      const paramirimTopics = allTopics.filter((topic) => {
        const key = topic.normalized.replace(/-ba$/, "");
        return key === "paramirim";
      });

      let canonical = allTopics.find((topic) => topic.normalized === "paramirim-ba");

      if (!canonical) {
        const existing = paramirimTopics[0];

        if (existing) {
          canonical = await tx.raffleTopic.update({
            where: { id: existing.id },
            data: { name: "Paramirim-BA", normalized: "paramirim-ba" },
            select: { id: true, name: true, normalized: true }
          });
        } else {
          canonical = await tx.raffleTopic.create({
            data: { name: "Paramirim-BA", normalized: "paramirim-ba" },
            select: { id: true, name: true, normalized: true }
          });
        }
      } else if (canonical.name !== "Paramirim-BA") {
        canonical = await tx.raffleTopic.update({
          where: { id: canonical.id },
          data: { name: "Paramirim-BA", normalized: "paramirim-ba" },
          select: { id: true, name: true, normalized: true }
        });
      }

      const duplicateParamirimIds = paramirimTopics
        .filter((topic) => topic.id !== canonical!.id)
        .map((topic) => topic.id);

      const legacyBotuporaIds = allTopics
        .filter((topic) => topic.id !== canonical!.id && topic.normalized.startsWith("botupora"))
        .map((topic) => topic.id);

      // A limpeza legada remove somente variantes antigas de Paramirim e Botuporã.
      // Tópicos novos e legítimos ficam intactos para uso futuro.
      const topicsToRemove = [...duplicateParamirimIds, ...legacyBotuporaIds];

      if (topicsToRemove.length > 0) {
        await tx.raffle.updateMany({
          where: { topicId: { in: topicsToRemove } },
          data: { topicId: canonical.id, city: "Paramirim-BA" }
        });

        await tx.raffleTopic.deleteMany({
          where: { id: { in: topicsToRemove } }
        });
      }

      await tx.raffle.updateMany({
        where: {
          OR: [
            { topicId: null, city: { startsWith: "Paramirim", mode: "insensitive" } },
            { topicId: null, city: { startsWith: "Botuporã", mode: "insensitive" } }
          ]
        },
        data: { topicId: canonical.id, city: "Paramirim-BA" }
      });

      await tx.raffle.updateMany({
        where: { topicId: canonical.id },
        data: { city: "Paramirim-BA" }
      });
    });

    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        raffleCode: true,
        name: true,
        city: true,
        topicId: true,
        topic: { select: { name: true } },
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

    const topics = await prisma.raffleTopic.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    });

    const confirmedCounts = await prisma.raffleNumber.groupBy({
      by: ["raffleId"],
      where: {
        status: "CONFIRMED",
        raffleId: { in: raffles.map((raffle) => raffle.id) }
      },
      _count: { _all: true }
    });

    const confirmedByRaffle = new Map(
      confirmedCounts.map((item) => [item.raffleId, item._count._all])
    );

    const bonusCounts = await prisma.raffleNumber.groupBy({
      by: ["raffleId"],
      where: { status: "CONFIRMED", reservationId: { startsWith: "BONUS:" } },
      _count: { _all: true }
    });
    const bonusByRaffle = new Map(
      bonusCounts.map((item) => [item.raffleId, item._count._all])
    );

    return NextResponse.json({
      topics,
      raffles: raffles.map((raffle) => ({
        ...raffle,
        topicName: raffle.topic?.name ?? raffle.city,
        confirmedCount: Math.max(0, (confirmedByRaffle.get(raffle.id) ?? 0) - (bonusByRaffle.get(raffle.id) ?? 0)),
        bonusCount: bonusByRaffle.get(raffle.id) ?? 0
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
    const productName = String(body.productName ?? "").trim();
    const name = productName;
    const city = String(body.city ?? "").trim();
    const topicIdInput = String(body.topicId ?? "").trim();
    const newTopicName = normalizeTopicName(String(body.newTopicName ?? ""));
    const description = String(body.description ?? "").trim();
    const totalNumbers = Number(body.totalNumbers);
    const priceInCents = parsePrice(String(body.pricePerNumber ?? ""));
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map((value: unknown) => String(value).trim()).filter(Boolean).slice(0, 10) : [];
    const rawEndDate = String(body.endDate ?? "").trim();
    const endDate = rawEndDate ? new Date(rawEndDate) : null;

    if (raffleCodeInput && !/^[A-Z0-9-]{3,30}$/.test(raffleCodeInput)) return NextResponse.json({ error: "O ID da rifa deve ter de 3 a 30 caracteres, usando apenas letras, números e hífen." }, { status: 400 });

    if (!productName || !Number.isInteger(totalNumbers) || totalNumbers < 1 || totalNumbers > 1_000_000 || !priceInCents || (endDate && Number.isNaN(endDate.getTime()))) {
      return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
    }

    if (endDate && endDate <= new Date()) {
      return NextResponse.json({ error: "A data de encerramento precisa ser futura." }, { status: 400 });
    }

    if (!topicIdInput && !newTopicName) {
      return NextResponse.json({ error: "Selecione um tópico ou crie um novo tópico para a rifa." }, { status: 400 });
    }

    const raffleCode = raffleCodeInput || await generateRaffleCode();

    const raffle = await prisma.$transaction(async (tx) => {
      let topicId = topicIdInput || null;
      if (newTopicName) {
        const normalized = normalizeTopicKey(newTopicName);
        const topic = await tx.raffleTopic.upsert({
          where: { normalized },
          update: {},
          create: { name: newTopicName, normalized }
        });
        topicId = topic.id;
      } else if (topicId) {
        const topic = await tx.raffleTopic.findUnique({ where: { id: topicId }, select: { id: true } });
        if (!topic) throw new Error("Tópico não encontrado.");
      }

      const selectedTopic = topicId ? await tx.raffleTopic.findUnique({ where: { id: topicId }, select: { name: true } }) : null;
      const raffleCity = city || selectedTopic?.name || newTopicName;
      if (!raffleCity) throw new Error("Tópico não informado.");
      const created = await tx.raffle.create({
        data: { raffleCode, name, city: raffleCity, topicId, productName, description, imageUrls, totalNumbers, priceInCents, endDate }
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

    if (body.editTopic === true) {
      const topicId = String(body.topicId ?? "").trim();
      const topicName = normalizeTopicName(String(body.topicName ?? ""));

      if (!topicId || !topicName) {
        return NextResponse.json({ error: "Informe o tópico e o novo nome." }, { status: 400 });
      }

      const normalized = normalizeTopicKey(topicName);

      const topic = await prisma.raffleTopic.findUnique({
        where: { id: topicId },
        select: { id: true, name: true }
      });

      if (!topic) {
        return NextResponse.json({ error: "Tópico não encontrado." }, { status: 404 });
      }

      const duplicate = await prisma.raffleTopic.findUnique({
        where: { normalized },
        select: { id: true }
      });

      if (duplicate && duplicate.id !== topicId) {
        return NextResponse.json({ error: "Já existe um tópico com esse nome." }, { status: 409 });
      }

      await prisma.$transaction([
        prisma.raffleTopic.update({
          where: { id: topicId },
          data: { name: topicName, normalized }
        }),
        prisma.raffle.updateMany({
          where: { topicId, city: topic.name },
          data: { city: topicName }
        })
      ]);

      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/minha-conta");

      return NextResponse.json({ id: topicId, name: topicName, ok: true });
    }

    if (isEdit) {
      const raffleCodeInput = normalizeRaffleCode(String(body.raffleCode ?? ""));
      const productName = String(body.productName ?? "").trim();
      const name = productName;
      const city = String(body.city ?? "").trim();
      const topicIdInput = String(body.topicId ?? "").trim();
      const newTopicName = normalizeTopicName(String(body.newTopicName ?? ""));
      const description = String(body.description ?? "").trim();
      const totalNumbers = Number(body.totalNumbers);
      const priceInCents = parsePrice(String(body.pricePerNumber ?? ""));
      const rawEndDate = String(body.endDate ?? "").trim();
      const endDate = rawEndDate ? new Date(rawEndDate) : null;
      const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map((value: unknown) => String(value).trim()).filter(Boolean).slice(0, 10) : [];

        if (raffleCodeInput && !/^[A-Z0-9-]{3,30}$/.test(raffleCodeInput)) return NextResponse.json({ error: "O ID da rifa deve ter de 3 a 30 caracteres, usando apenas letras, números e hífen." }, { status: 400 });
      if (!id || !name || !productName || !Number.isInteger(totalNumbers) || totalNumbers < 1 || totalNumbers > 1_000_000 || !priceInCents || (endDate && Number.isNaN(endDate.getTime()))) {
        return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
      }
      if (endDate && endDate <= new Date()) return NextResponse.json({ error: "A data do sorteio precisa ser futura." }, { status: 400 });

      const current = await prisma.raffle.findUnique({ where: { id }, select: { totalNumbers: true } });
      if (!current) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
      if (totalNumbers !== current.totalNumbers) return NextResponse.json({ error: "A quantidade de números é fixa depois que a rifa é criada." }, { status: 400 });

      let topicId = topicIdInput || null;
      if (newTopicName) {
        const normalized = normalizeTopicKey(newTopicName);
        const topic = await prisma.raffleTopic.upsert({
          where: { normalized },
          update: {},
          create: { name: newTopicName, normalized }
        });
        topicId = topic.id;
      } else if (topicId) {
        const topic = await prisma.raffleTopic.findUnique({ where: { id: topicId }, select: { id: true } });
        if (!topic) return NextResponse.json({ error: "Tópico não encontrado." }, { status: 400 });
      }

      const raffleCode = raffleCodeInput || (await prisma.raffle.findUnique({ where: { id }, select: { raffleCode: true } }))?.raffleCode;
      if (!raffleCode) return NextResponse.json({ error: "ID da rifa não encontrado." }, { status: 400 });

      const duplicate = await prisma.raffle.findFirst({ where: { raffleCode, NOT: { id } }, select: { id: true } });
      if (duplicate) return NextResponse.json({ error: "Esse ID de rifa já está sendo usado. Escolha outro." }, { status: 409 });

      const selectedTopic = topicId ? await prisma.raffleTopic.findUnique({ where: { id: topicId }, select: { name: true } }) : null;
      const raffleCity = city || selectedTopic?.name || newTopicName;
      if (!raffleCity) return NextResponse.json({ error: "Tópico não informado." }, { status: 400 });
      await prisma.raffle.update({
        where: { id },
        data: { raffleCode, name, city: raffleCity, topicId, productName, description, priceInCents, endDate, imageUrls }
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

    if (!id || !["ACTIVE", "PAUSED"].includes(status)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const currentRaffle = await prisma.raffle.findUnique({
      where: { id },
      select: { id: true, resultStatus: true, status: true }
    });

    if (!currentRaffle) {
      return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
    }

    if (currentRaffle.resultStatus === "WINNER" || currentRaffle.status === "ENDED") {
      return NextResponse.json({ error: "Esta rifa já foi finalizada e não pode ser reativada." }, { status: 409 });
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

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const topicId = String(body.topicId ?? "").trim();
    const targetTopicId = String(body.targetTopicId ?? "").trim();
    const targetTopicNameInput = normalizeTopicName(String(body.targetTopicName ?? ""));

    if (topicId) {
      const topic = await prisma.raffleTopic.findUnique({
        where: { id: topicId },
        select: { id: true, name: true, _count: { select: { raffles: true } } }
      });

      if (!topic) {
        return NextResponse.json({ error: "Tópico não encontrado." }, { status: 404 });
      }

      let targetTopic = targetTopicId
        ? await prisma.raffleTopic.findUnique({
            where: { id: targetTopicId },
            select: { id: true, name: true }
          })
        : null;

      if (targetTopicId === topicId) {
        return NextResponse.json(
          { error: "O tópico de destino precisa ser diferente do tópico excluído." },
          { status: 400 }
        );
      }

      if (!targetTopic && targetTopicNameInput) {
        const normalized = normalizeTopicKey(targetTopicNameInput);
        targetTopic = await prisma.raffleTopic.findUnique({
          where: { normalized },
          select: { id: true, name: true }
        });

        if (!targetTopic) {
          targetTopic = await prisma.raffleTopic.create({
            data: { name: targetTopicNameInput, normalized },
            select: { id: true, name: true }
          });
        }
      }

      if (!targetTopic) {
        return NextResponse.json(
          { error: "Informe o tópico que receberá as rifas antes de excluir este tópico." },
          { status: 400 }
        );
      }

      const moved = await prisma.$transaction(async (tx) => {
        const result = await tx.raffle.updateMany({
          where: { topicId },
          data: {
            topicId: targetTopic!.id,
            city: targetTopic!.name
          }
        });

        // Se Paramirim estava apenas no campo antigo de cidade, recupera também essas rifas
        // para que o tópico regional continue disponível após a limpeza.
        let movedOrphaned = 0;
        const targetTopicKey = normalizeTopicKey(targetTopic!.name).replace(/-ba$/, "");
        if (targetTopicKey === "paramirim") {
          const orphaned = await tx.raffle.updateMany({
            where: {
              topicId: null,
              OR: [
                { city: { equals: "Paramirim", mode: "insensitive" } },
                { city: { equals: "Paramirim-BA", mode: "insensitive" } },
                { city: { startsWith: "Botuporã", mode: "insensitive" } }
              ]
            },
            data: {
              topicId: targetTopic!.id,
              city: targetTopic!.name
            }
          });
          movedOrphaned = orphaned.count;
        }

        await tx.raffleTopic.delete({ where: { id: topicId } });
        return result.count + movedOrphaned;
      });

      revalidatePath("/");
      revalidatePath("/minha-conta");
      revalidatePath("/admin");

      return NextResponse.json({
        id: topicId,
        targetTopicId,
        movedRaffles: moved,
        message: moved > 0
          ? `Tópico excluído. ${moved} rifa(s) foram transferidas para "Rifas em ${targetTopic.name.replace(/^Rifas em\\s+/i, "")}".`
          : "Tópico excluído. Não havia rifas vinculadas a ele."
      });
    }

    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json({ error: "Rifa não encontrada." }, { status: 400 });
    }

    const raffle = await prisma.raffle.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!raffle) {
      return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
    }

    await prisma.raffle.delete({ where: { id } });

    revalidatePath("/");
    revalidatePath("/minha-conta");
    revalidatePath("/admin");

    return NextResponse.json({ id, message: "Rifa excluída com sucesso." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível excluir o item." }, { status: 500 });
  }
}
