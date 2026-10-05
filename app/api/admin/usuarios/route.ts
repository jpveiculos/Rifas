import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashUserPassword, validateCredentials } from "@/lib/auth";

function cleanUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") ?? "").trim();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { username: { contains: q.toLowerCase(), mode: "insensitive" } },
            { whatsapp: { contains: q.replace(/\D/g, "") } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, name: true, city: true, username: true, whatsapp: true,
      createdAt: true,
      _count: { select: { participations: true, numbers: true } }
    }
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });

    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const name = String(body.name ?? current.name).trim();
    const city = String(body.city ?? current.city).trim();
    const username = cleanUsername(String(body.username ?? current.username));
    const whatsapp = String(body.whatsapp ?? current.whatsapp);
    const password = String(body.password ?? "");

    if (password) {
      const validation = validateCredentials(name, city, username, whatsapp, password);
      if (validation) return NextResponse.json({ error: validation }, { status: 400 });
    } else {
      if (name.length < 3 || name.length > 100) return NextResponse.json({ error: "Informe o nome completo." }, { status: 400 });
      if (city.length < 2 || city.length > 80) return NextResponse.json({ error: "Informe a cidade." }, { status: 400 });
      if (!/^[a-z0-9._-]{3,30}$/.test(username)) return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
      const cleanWhatsapp = whatsapp.replace(/\D/g, "");
      if (cleanWhatsapp.length < 10 || cleanWhatsapp.length > 15) return NextResponse.json({ error: "WhatsApp ou telefone inválido." }, { status: 400 });
    }

    const duplicate = await prisma.user.findFirst({ where: { username, NOT: { id } } });
    if (duplicate) return NextResponse.json({ error: "Esse usuário já está cadastrado." }, { status: 400 });

    const data: { name: string; city: string; username: string; whatsapp: string; passwordHash?: string } = {
      name, city, username, whatsapp: whatsapp.replace(/\D/g, "")
    };
    if (password) data.passwordHash = await hashUserPassword(password);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, city: true, username: true, whatsapp: true, createdAt: true }
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível editar o usuário." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    const user = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { participations: true, numbers: true } } }
    });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    if (user._count.participations > 0 || user._count.numbers > 0) {
      return NextResponse.json({
        error: "Este participante possui histórico de participação ou números vinculados. Para preservar o histórico financeiro e dos sorteios, o cadastro não pode ser excluído."
      }, { status: 409 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível excluir o usuário." }, { status: 500 });
  }
}
