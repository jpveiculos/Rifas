import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/app/LogoutButton";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link className="brand" href="/">
          <span>Rifas<span className="brand-dot">.</span><strong>TOP</strong></span>
        </Link>

        <div className="header-actions">
          <Link className="header-link" href="/">Início</Link>
          <Link className="header-link" href="/#rifas">Rifas</Link>

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
