import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { whatsapp: { contains: query } }
      ]
    },
    select: { id: true, name: true, username: true, whatsapp: true, city: true },
    orderBy: { name: "asc" },
    take: 20
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = await request.json();
    const userId = String(body.userId ?? "").trim();
    const raffleId = String(body.raffleId ?? "").trim();
    const quantity = Number(body.quantity);

    if (!userId || !raffleId || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      return NextResponse.json({ error: "Informe usuário, rifa e uma quantidade válida (1 a 1.000)." }, { status: 400 });
    }

    const [user, raffle] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
      prisma.raffle.findUnique({ where: { id: raffleId }, select: { id: true, productName: true, status: true } })
    ]);

    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    if (!raffle) return NextResponse.json({ error: "Rifa não encontrada." }, { status: 404 });
    if (raffle.status === "ENDED") return NextResponse.json({ error: "Não é possível bonificar uma rifa encerrada." }, { status: 409 });

    const available = await prisma.raffleNumber.findMany({
      where: { raffleId, status: "AVAILABLE" },
      select: { id: true, number: true },
      take: quantity * 3
    });

    if (available.length < quantity) {
      return NextResponse.json({ error: "Não há números disponíveis suficientes para essa bonificação." }, { status: 409 });
    }

    const selected = [...available].sort(() => Math.random() - 0.5).slice(0, quantity);
    const bonusReservationId = "BONUS:" + crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      for (const item of selected) {
        const updated = await tx.raffleNumber.updateMany({
          where: { id: item.id, status: "AVAILABLE" },
          data: {
            status: "CONFIRMED",
            reservationId: bonusReservationId,
            confirmedAt: new Date(),
            reservedByUserId: userId
          }
        });
        if (updated.count !== 1) throw new Error("NUMBER_CONFLICT");
      }

      // A bonificação também cria uma participação confirmada, sem cobrança.
      // Isso faz a rifa aparecer corretamente na "Minha Conta" do cliente.
      await tx.raffleParticipation.create({
        data: {
          raffleId,
          userId,
          reservationId: bonusReservationId,
          quantity,
          amountInCents: 0,
          status: "APPROVED",
          mercadopagoStatus: "bonus",
          mercadopagoStatusDetail: "Números creditados como bonificação pelo administrador.",
          mercadopagoPaidAmountInCents: 0,
          approvedAt: new Date()
        }
      });
    });

    return NextResponse.json({
      ok: true,
      user: user.name,
      raffle: raffle.productName,
      numbers: selected.map((item) => item.number).sort((a, b) => a - b)
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NUMBER_CONFLICT") {
      return NextResponse.json({ error: "Alguns números foram ocupados ao mesmo tempo. Tente novamente." }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Não foi possível creditar os números." }, { status: 500 });
  }
}
