import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import HomeRaffleBrowser from "@/app/HomeRaffleBrowser";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const raffles = await prisma.raffle.findMany({
    where: { status: { in: ["ACTIVE", "ENDED"] } },
    orderBy: { createdAt: "desc" }
  });

  const activeRaffles = raffles
    .filter((raffle) => raffle.status === "ACTIVE")
    .map((raffle) => ({
      id: raffle.id,
      raffleCode: raffle.raffleCode,
      name: raffle.name,
      productName: raffle.productName,
      category: raffle.category,
      description: raffle.description,
      imageUrls: raffle.imageUrls,
      priceInCents: raffle.priceInCents,
      winningNumber: raffle.winningNumber,
      winningNumbers: raffle.winningNumbers
    }));

  const finishedRaffles = raffles
    .filter((raffle) => raffle.status === "ENDED")
    .map((raffle) => ({
      id: raffle.id,
      raffleCode: raffle.raffleCode,
      name: raffle.name,
      productName: raffle.productName,
      category: raffle.category,
      description: raffle.description,
      imageUrls: raffle.imageUrls,
      priceInCents: raffle.priceInCents,
      winningNumber: raffle.winningNumber,
      winningNumbers: raffle.winningNumbers
    }));

  const activeCount = activeRaffles.length;
  const finishedCount = finishedRaffles.length;

  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link className="brand" href="/">
            <span>Rifas<span className="brand-dot">.</span><strong>TOP</strong></span>
          </Link>
          <div className="header-actions">
            <Link className="header-link" href="/">Início</Link>
            <Link className="header-link" href="#rifas">Rifas</Link>
            {user ? (
              <Link className="header-login" href="/minha-conta">Minha Área · {user.username}</Link>
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
              <p>Escolha seus números, acompanhe o sorteio e confira tudo pela sua área de participante.</p>
              <div className="hero-actions">
                <Link className="hero-button" href="#rifas">Ver rifas</Link>
                {!user && <Link className="hero-secondary" href="/cadastro">Criar minha conta</Link>}
              </div>
              <div className="hero-benefits">
                <div><span>01</span><strong>Escolha seus números</strong></div>
                <div><span>02</span><strong>Pagamento fácil</strong></div>
                <div><span>03</span><strong>Confira o resultado</strong></div>
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
                <span className="section-kicker">RIFAS</span>
                <h2 className="section-title">Encontre sua rifa</h2>
              </div>
              {raffles.length > 0 && (
                <span className="raffle-count">
                  {activeCount} em andamento{finishedCount > 0 ? " · " + finishedCount + " finalizadas" : ""}
                </span>
              )}
            </div>

            {raffles.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhuma rifa publicada ainda.</h3>
                <p>As rifas criadas e ativadas no painel administrativo aparecerão aqui.</p>
              </div>
            ) : (
              <HomeRaffleBrowser activeRaffles={activeRaffles} finishedRaffles={finishedRaffles} />
            )}
          </div>
        </section>
      </main>

      <footer className="footer"><div className="container">Rifas.TOP · Plataforma pessoal</div></footer>
    </>
  );
}
