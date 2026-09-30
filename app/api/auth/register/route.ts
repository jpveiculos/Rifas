import { NextResponse } from "next/server";
import { createUser, startSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "");
    const city = String(body.city ?? "");
    const username = String(body.username ?? "");
    const whatsapp = String(body.whatsapp ?? "");
    const password = String(body.password ?? "");

    const user = await createUser(name, city, username, whatsapp, password);
    await startSession(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar a conta.";
    const status = message.includes("já está cadastrado") || message.includes("deve ter") || message.includes("Informe") || message.includes("senha") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
