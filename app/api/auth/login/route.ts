import { NextResponse } from "next/server";
import { authenticateUser, startSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "");
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json({ error: "Informe usuário e senha." }, { status: 400 });
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
    }

    await startSession(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível entrar." }, { status: 500 });
  }
}
