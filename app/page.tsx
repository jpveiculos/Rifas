import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ShareRaffle from "@/app/rifa/ShareRaffle";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const raffles = await prisma.raffle.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link className="brand" href="/">
            <span>Rifas<span className="brand-dot">.</span><strong>top</strong></span>
          </Link>
          <div className="header-actions">
            <Link className="header-link" href="/">Início</Link>
            <Link className="header-link" href="#rifas">Rifas</Link>
            {user ? (
              <Link className="header-login" href="/minha-conta">Olá, {user.username}</Link>
            ) : (
              <Link className="header-login" href="/login">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="home-hero">
          <div className="container home-hero-grid">
            <div className="home-hero-copy">
              <span className="hero-kicker">RIFAS.TOP</span>
              <h1>Concorra a prêmios incríveis.</h1>
              <p>Escolha seus números, faça seu pagamento e participe das nossas rifas de forma simples e rápida.</p>
              <div className="hero-actions">
                <Link className="hero-button" href="#rifas">Ver rifas disponíveis</Link>
                {!user && <Link className="hero-secondary" href="/cadastro">Criar minha conta</Link>}
              </div>
              <div className="hero-benefits">
                <div><span>01</span><strong>Escolha seus números</strong></div>
                <div><span>02</span><strong>Pagamento fácil</strong></div>
                <div><span>03</span><strong>Boa sorte!</strong></div>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="ticket ticket-one">RIFAS.TOP</div>
              <div className="ticket ticket-two">001</div>
              <div className="ticket ticket-three">TOP</div>
              <div className="hero-circle"><strong>Rifas</strong><b>.TOP</b></div>
              <div className="hero-spark spark-one">✦</div>
              <div className="hero-spark spark-two">✦</div>
              <div className="hero-orbit"></div>
            </div>
          </div>
        </section>

        <section className="section raffle-section" id="rifas">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-kicker">PARTICIPE AGORA</span>
                <h2 className="section-title">Rifas em destaque</h2>
              </div>
              {raffles.length > 0 && <span className="raffle-count">{raffles.length} {raffles.length === 1 ? "rifa disponível" : "rifas disponíveis"}</span>}
            </div>

            {raffles.length === 0 ? (
              <div className="empty-state"><h3>Nenhuma rifa publicada ainda.</h3><p>As rifas criadas e ativadas no painel administrativo aparecerão aqui.</p></div>
            ) : (
              <div className="raffle-grid">
                {raffles.map((raffle) => (
                  <article className="raffle-card" key={raffle.id}>
                    {raffle.imageUrls.length > 0 ? (
                      <img className="raffle-card-image" src={raffle.imageUrls[0]} alt={raffle.productName} />
                    ) : (
                      <div className="raffle-card-image raffle-card-placeholder"><span>Rifas.TOP</span></div>
                    )}
                    <div className="raffle-card-content">
                      <span className="badge">EM ANDAMENTO</span>
                      <h3>{raffle.productName}</h3>
                      <p>{raffle.description}</p>
                      <div className="card-price">{(raffle.priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}<small> por número</small></div>
                      <div className="raffle-meta">
                        <span>🎟 {raffle.totalNumbers.toLocaleString("pt-BR")} números</span>
                        <span>● Ativa</span>
                      </div>
                      <Link className="primary-button" href={"/rifa/" + raffle.id}>Escolher números</Link>
                      <ShareRaffle raffleName={raffle.name} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer"><div className="container">Rifas.top · Plataforma pessoal</div></footer>
    </>
  );
}