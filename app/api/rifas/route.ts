import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parsePrice(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.raffleName ?? "").trim();
    const productName = String(body.productName ?? "").trim();
    const description = String(body.description ?? "").trim();
    const totalNumbers = Number(body.totalNumbers);
    const priceInCents = parsePrice(String(body.pricePerNumber ?? ""));
    const endDate = new Date(String(body.endDate ?? ""));

    if (!name || !productName || !description || !Number.isInteger(totalNumbers) || totalNumbers < 1 || !priceInCents || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
    }

    const raffle = await prisma.raffle.create({
      data: {
        name,
        productName,
        description,
        totalNumbers,
        priceInCents,
        endDate
      }
    });

    await prisma.raffleNumber.createMany({
      data: Array.from({ length: totalNumbers }, (_, index) => ({
        raffleId: raffle.id,
        number: index + 1
      }))
    });

    return NextResponse.json({ id: raffle.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível salvar a rifa." }, { status: 500 });
  }
}