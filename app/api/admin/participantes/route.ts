import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth";

function authorized(request: Request) {
  const configured = process.env.ADMIN_PASSWORD;
  const provided = request.headers.get("x-admin-password");
  return Boolean(configured && provided && provided === configured);
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "A senha administrativa ainda não foi configurada no servidor." }, { status: 503 });
  }

  if (!authorized(request)) {
    return NextResponse.json({ error: "Senha administrativa incorreta." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const user = await createUser(
      String(body.username ?? ""),
      String(body.whatsapp ?? ""),
      String(body.password ?? "")
    );

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível cadastrar o participante.";
    const status = message.includes("já está cadastrado") || message.includes("deve ter") || message.includes("Informe") || message.includes("senha") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
