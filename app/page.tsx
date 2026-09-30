import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ShareRaffle from "@/app/rifa/ShareRaffle";
import { RAFFLE_CATEGORIES } from "@/lib/raffle-categories";

export const dynamic = "force-dynamic";

function formatNumber(value: number | string) {
  return String(value).padStart(5, "0");
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const raffles = await prisma.raffle.findMany({
    where: { status: { in: ["ACTIVE", "ENDED"] } },
    orderBy: { createdAt: "desc" }
  });

  const activeCount = raffles.filter((raffle) => raffle.status === "ACTIVE").length;
  const finishedCount = raffles.filter((raffle) => raffle.status === "ENDED").length;

  const groupedRaffles = RAFFLE_CATEGORIES.map((category) => ({
    category,
    raffles: raffles.filter((raffle) => raffle.category === category)
  })).filter((group) => group.raffles.length > 0);

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
                <h2 className="section-title">Rifas em destaque</h2>
              </div>
              {raffles.length > 0 && (
                <span className="raffle-count">
                  {activeCount} em andamento{finishedCount > 0 ? " · " + finishedCount + " finalizadas" : ""}
                </span>
              )}
            </div>

            {raffles.length === 0 ? (
              <div className="empty-state"><h3>Nenhuma rifa publicada ainda.</h3><p>As rifas criadas e ativadas no painel administrativo aparecerão aqui.</p></div>
            ) : (
              <div className="raffle-category-list">
                {groupedRaffles.map((group) => (
                  <section className="raffle-category-section" key={group.category}>
                    <div className="raffle-category-heading">
                      <div>
                        <span className="section-kicker">CATEGORIA</span>
                        <h3>{group.category}</h3>
                      </div>
                      <span>{group.raffles.length} {group.raffles.length === 1 ? "rifa" : "rifas"}</span>
                    </div>

                    <div className="raffle-grid">
                      {group.raffles.map((raffle) => {
                        const winningNumbers = raffle.winningNumbers?.length > 0
                          ? raffle.winningNumbers
                          : raffle.winningNumber !== null
                            ? [raffle.winningNumber]
                            : [];
                        const finished = raffle.status === "ENDED";

                        return (
                          <article className="raffle-card" key={raffle.id}>
                            {raffle.imageUrls.length > 0 ? (
                              <img className="raffle-card-image" src={raffle.imageUrls[0]} alt={raffle.productName} />
                            ) : (
                              <div className="raffle-card-image raffle-card-placeholder"><span>Rifas.TOP</span></div>
                            )}

                            <div className="raffle-card-content">
                              <span className={"badge " + (finished ? "badge-finished" : "")}>
                                {finished ? "SORTEIO FINALIZADO" : "EM ANDAMENTO"}
                              </span>
                              <div className="raffle-code-public">{raffle.raffleCode ? "ID " + raffle.raffleCode : ""}</div>
                              <h3>{raffle.productName}</h3>
                              <p>{raffle.description}</p>

                              {finished && winningNumbers.length > 0 && (
                                <div className="public-draw-result public-draw-winner">
                                  <span>Número(s) sorteado(s)</span>
                                  <strong>{winningNumbers.map(formatNumber).join(" · ")}</strong>
                                  <small>Rifa finalizada com ganhador.</small>
                                </div>
                              )}

                              <div className="card-price">{(raffle.priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}<small> por número</small></div>
                              <div className="raffle-meta">
                                <span>{finished ? "● Finalizada" : "● Ativa"}</span>
                              </div>

                              {finished ? (
                                <Link className="primary-button" href={"/rifa/" + raffle.id}>Ver resultado</Link>
                              ) : (
                                <>
                                  <Link className="primary-button" href={"/rifa/" + raffle.id}>Escolher números</Link>
                                  <ShareRaffle raffleName={raffle.name} />
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer"><div className="container">Rifas.TOP · Plataforma pessoal</div></footer>
    </>
  );
}
