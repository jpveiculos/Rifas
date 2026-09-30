import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="auth-brand" href="/">Rifas</Link>
        <h1>Minha conta</h1>
        <div className="account-info">
          <div><span>Nome completo</span><strong>{user.name}</strong></div>
          <div><span>Cidade</span><strong>{user.city}</strong></div>
          <div><span>Usuário</span><strong>{user.username}</strong></div>
          <div><span>WhatsApp / telefone</span><strong>{user.whatsapp}</strong></div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="secondary-button auth-logout" type="submit">Sair da conta</button>
        </form>
        <Link className="auth-back" href="/">← Voltar para o início</Link>
      </div>
    </main>
  );
}
