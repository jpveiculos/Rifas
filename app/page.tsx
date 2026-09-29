import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const raffles = await prisma.raffle.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <header className="site-header"><div className="container site-header-inner">
        <Link className="brand" href="/">Rifas</Link>
        <Link className="header-link" href="/admin">Área administrativa</Link>
      </div></header>

      <main>
        <section className="hero"><div className="container">
          <h1>Escolha sua rifa e participe de forma simples.</h1>
          <p>Cada rifa terá seus próprios números, produto, preço e regras. Os números serão distribuídos automaticamente conforme a quantidade escolhida.</p>
        </div></section>

        <section className="section"><div className="container">
          <h2 className="section-title">Rifas disponíveis</h2>
          {raffles.length === 0 ? (
            <div className="empty-state"><h3>Nenhuma rifa publicada ainda.</h3><p>As rifas criadas e ativadas no painel administrativo aparecerão aqui.</p></div>
          ) : raffles.map((raffle) => (
            <article className="raffle-card" key={raffle.id}><div className="raffle-card-content">
              <span className="badge">ATIVA</span>
              <h3>{raffle.name}</h3><p>{raffle.description}</p>
              <div className="info-row">
                <div className="info-item"><span className="info-label">Produto</span><span className="info-value">{raffle.productName}</span></div>
                <div className="info-item"><span className="info-label">Números</span><span className="info-value">{raffle.totalNumbers.toLocaleString("pt-BR")}</span></div>
                <div className="info-item"><span className="info-label">Por número</span><span className="info-value">{(raffle.priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
              </div>
              <Link className="primary-button" href={"/rifa/" + raffle.id}>Participar</Link>
            </div></article>
          ))}
        </div></section>
      </main>

      <footer className="footer"><div className="container">Rifas · Plataforma pessoal</div></footer>
    </>
  );
}