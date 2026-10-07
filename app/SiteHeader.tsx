import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/app/LogoutButton";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link className="brand" href="/">
          <span>Rifas<strong>TOP</strong></span>
        </Link>

        {user ? (
          <div className="header-greeting" aria-label={"Usuário conectado: " + user.name}>
            Olá, <strong>{user.name.split(/\s+/)[0]}</strong>!
          </div>
        ) : null}

        <div className="header-actions">
          {user ? (
            <>
              <Link className="header-login" href="/minha-conta">Minha Conta</Link>
              <LogoutButton />
            </>
          ) : (
            <Link className="header-login" href="/login">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}
