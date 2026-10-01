import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatNumber(value: number | string) {
  return String(value).padStart(5, "0");
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const participations = await prisma.raffleParticipation.findMany({
    where: {
      userId: user.id,
      status: "APPROVED",
      raffle: { status: "ACTIVE" }
    },
    orderBy: { createdAt: "desc" },
    include: {
      raffle: {
        select: {
          id: true,
          raffleCode: true,
          name: true,
          productName: true,
          imageUrls: true
        }
      }
    }
  });

  const numbers = await prisma.raffleNumber.findMany({
    where: {
      reservedByUserId: user.id,
      status: "CONFIRMED",
      raffle: { status: "ACTIVE" }
    },
    select: {
      number: true,
      reservationId: true
    },
    orderBy: { number: "asc" }
  });

  const numbersByReservation = new Map<string, number[]>();
  for (const item of numbers) {
    const key = item.reservationId ?? "";
    const current = numbersByReservation.get(key) ?? [];
    current.push(item.number);
    numbersByReservation.set(key, current);
  }

  const recentResults = await prisma.raffle.findMany({
    where: {
      status: "ENDED",
      resultPublishedAt: { not: null }
    },
    orderBy: { resultPublishedAt: "desc" },
    take: 3,
    select: {
      id: true,
      raffleCode: true,
      name: true,
      productName: true,
      winningNumber: true,
      winningNumbers: true,
      resultPublishedAt: true
    }
  });

  function participationNumbers(reservationId: string) {
    return (numbersByReservation.get(reservationId) ?? []).sort((a, b) => a - b);
  }

  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link className="brand" href="/">
            <span>Rifas<span className="brand-dot">.</span><strong>TOP</strong></span>
          </Link>
          <div className="header-actions">
            <Link className="header-link" href="/">Início</Link>
            <Link className="header-link" href="/#rifas">Rifas</Link>
            <span className="header-login">Olá, {user.username}</span>
          </div>
        </div>
      </header>

      <main className="account-page account-page-clean">
        <div className="container account-container">
          <section className="account-section account-participations">
            <div className="account-section-heading">
              <div>
                <span className="section-kicker">MINHA CONTA</span>
                <h1>Minhas rifas</h1>
              </div>
              <Link className="account-back-button" href="/#rifas">Ver rifas</Link>
            </div>

            {participations.length === 0 ? (
              <div className="account-empty">
                <strong>Você ainda não está participando de nenhuma rifa.</strong>
                <span>Escolha uma rifa para participar e seus números aparecerão aqui.</span>
              </div>
            ) : (
              <div className="account-list">
                {participations.map((item) => {
                  const mine = participationNumbers(item.reservationId);
                  return (
                    <article className="account-raffle-card" key={item.id}>
                      <div className="account-card-image">
                        {item.raffle.imageUrls[0] ? (
                          <img src={item.raffle.imageUrls[0]} alt={item.raffle.productName} />
                        ) : (
                          <span>Rifas.TOP</span>
                        )}
                      </div>
                      <div className="account-card-content">
                        <span className="account-status status-active">Participando</span>
                        <h3>{item.raffle.productName}</h3>
                        <p>
                          {item.raffle.name}
                          {item.raffle.raffleCode ? " · ID " + item.raffle.raffleCode : ""}
                        </p>
                        <div className="account-numbers">
                          <span>Seus números</span>
                          <div>
                            {mine.map((number) => (
                              <b key={number}>{formatNumber(number)}</b>
                            ))}
                          </div>
                        </div>
                        <Link className="secondary-button account-button" href={"/rifa/" + item.raffle.id}>
                          Ver rifa
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="account-section account-results-section">
            <div className="account-section-heading">
              <div>
                <span className="section-kicker">ATUALIZAÇÕES</span>
                <h2>Resultados recentes</h2>
              </div>
              <span>Últimos 3</span>
            </div>

            {recentResults.length === 0 ? (
              <div className="account-empty account-empty-small">
                <strong>Nenhum resultado publicado ainda.</strong>
                <span>Os resultados aparecerão aqui assim que as rifas forem finalizadas.</span>
              </div>
            ) : (
              <div className="account-results-list">
                {recentResults.map((raffle) => {
                  const winners = raffle.winningNumbers.length > 0
                    ? raffle.winningNumbers
                    : raffle.winningNumber !== null
                      ? [raffle.winningNumber]
                      : [];

                  return (
                    <article className="account-result-card" key={raffle.id}>
                      <div className="account-result-main">
                        <span>Rifa finalizada</span>
                        <strong>{raffle.productName}</strong>
                        <small>
                          {raffle.name}
                          {raffle.raffleCode ? " · ID " + raffle.raffleCode : ""}
                        </small>
                      </div>
                      <div className="account-result-number">
                        <span>Número vencedor</span>
                        <strong>{winners.length > 0 ? winners.map(formatNumber).join(" · ") : "—"}</strong>
                        {raffle.resultPublishedAt && <small>{formatDate(raffle.resultPublishedAt)}</small>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="account-important">
            <strong>Importante</strong>
            <p>
              Os resultados são atualizados automaticamente nesta área sempre que uma rifa é finalizada e o resultado é publicado.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
