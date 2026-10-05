import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <Link className="footer-brand" href="/">
          <span>Rifas<strong>TOP</strong></span>
        </Link>

        <div className="footer-company">
          <strong>RifasTOP</strong>
          <span>Plataforma de Rifas</span>
        </div>

        <div className="footer-copy">
          © {new Date().getFullYear()} RifasTOP. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
