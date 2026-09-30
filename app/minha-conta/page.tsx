import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      raffle: {
        select: {
          id: true,
          raffleCode: true,
          name: true,
          productName: true,
          imageUrls: true,
          priceInCents: true,
          status: true,
          endDate: true,
          winningNumber: true,
          winningNumbers: true,
          resultStatus: true,
          resultPublishedAt: true
        }
      }
    }
  });

  const numbers = await prisma.raffleNumber.findMany({
    where: {
      reservedByUserId: user.id,
      status: { in: ["RESERVED", "CONFIRMED"] }
    },
    select: {
      number: true,
      raffleId: true,
      reservationId: true,
      status: true
    },
    orderBy: { number: "asc" }
  });

  const numbersByReservation = new Map<string, number[]>();
  for (const item of numbers) {
    const current = numbersByReservation.get(item.reservationId ?? "") ?? [];
    current.push(item.number);
    numbersByReservation.set(item.reservationId ?? "", current);
  }

  const active = participations.filter((item) => item.raffle.status === "ACTIVE" && item.status === "APPROVED");
  const pending = participations.filter((item) => item.status === "PENDING");
  const finished = participations.filter((item) => item.raffle.status === "ENDED" && item.status === "APPROVED");
  const rejected = participations.filter((item) => item.status === "REJECTED");

  const confirmedNumberCount = numbers.filter((item) => item.status === "CONFIRMED").length;
  const wonCount = finished.filter((item) => {
    const mine = numbersByReservation.get(item.reservationId) ?? [];
    const winningNumbers = item.raffle.winningNumbers.length > 0
      ? item.raffle.winningNumbers
      : item.raffle.winningNumber !== null
        ? [item.raffle.winningNumber]
        : [];
    return winningNumbers.some((number) => mine.includes(number));
  }).length;

  function participationNumbers(reservationId: string) {
    return (numbersByReservation.get(reservationId) ?? []).sort((a, b) => a - b);
  }

  function winningNumbers(item: (typeof participations)[number]) {
    return item.raffle.winningNumbers.length > 0
      ? item.raffle.winningNumbers
      : item.raffle.winningNumber !== null
        ? [item.raffle.winningNumber]
        : [];
  }

  function ResultNotice({ item }: { item: (typeof participations)[number] }) {
    const winners = winningNumbers(item);
    if (winners.length === 0) return null;

    return (
      <div className="account-result account-result-winner">
        <span>Número vencedor</span>
        <strong>{formatNumber(winners[0])}</strong>
        <small>Resultado do sorteio publicado.</small>
      </div>
    );
  }

  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link className="brand" href="/"><span>Rifas<span className="brand-dot">.</span><strong>TOP</strong></span></Link>
          <div className="header-actions">
            <Link className="header-link" href="/">Início</Link>
            <Link className="header-link" href="/#rifas">Rifas</Link>
            <span className="header-login">Olá, {user.username}</span>
          </div>
        </div>
      </header>

      <main className="account-page">
        <div className="container account-container">
          <div className="account-heading">
            <div>
              <span className="section-kicker">ÁREA DO PARTICIPANTE</span>
              <h1>Minha Área</h1>
              <p>Acompanhe seus números e veja imediatamente o resultado do sorteio.</p>
            </div>
            <Link className="account-back-button" href="/">Ver rifas</Link>
          </div>

          <section className="account-summary">
            <div><strong>{active.length}</strong><span>rifas em andamento</span></div>
            <div><strong>{confirmedNumberCount}</strong><span>números confirmados</span></div>
            <div><strong>{finished.length}</strong><span>rifas finalizadas</span></div>
            <div className="account-summary-prize"><strong>{wonCount}</strong><span>premiação</span></div>
          </section>

          {pending.length > 0 && (
            <section className="account-section">
              <div className="account-section-heading">
                <div><span className="section-kicker">PAGAMENTO</span><h2>Aguardando pagamento</h2></div>
                <span>{pending.length} {pending.length === 1 ? "participação" : "participações"}</span>
              </div>
              <div className="account-list">
                {pending.map((item) => {
                  const mine = participationNumbers(item.reservationId);
                  return (
                    <article className="account-raffle-card account-pending-card" key={item.id}>
                      <div className="account-card-image">{item.raffle.imageUrls[0] ? <img src={item.raffle.imageUrls[0]} alt={item.raffle.productName} /> : <span>Rifas.TOP</span>}</div>
                      <div className="account-card-content">
                        <span className="account-status status-pending">Pagamento pendente</span>
                        <h3>{item.raffle.productName}</h3>
                        <p>{item.raffle.name}{item.raffle.raffleCode ? " · ID " + item.raffle.raffleCode : ""}</p>
                        {mine.length > 0 && <div className="account-numbers"><span>Seus números</span><div>{mine.map((number) => <b key={number}>{formatNumber(number)}</b>)}</div></div>}
                        <ResultNotice item={item} />
                        <div className="account-card-footer"><strong>{formatMoney(item.amountInCents)}</strong><span>{formatDate(item.createdAt)}</span></div>
                        <Link className="primary-button" href={"/rifa/" + item.raffle.id}>Voltar para a rifa</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="account-section">
            <div className="account-section-heading">
              <div><span className="section-kicker">MINHAS RIFAS</span><h2>Rifas em andamento</h2></div>
              <span>{active.length}</span>
            </div>
            {active.length === 0 ? (
              <div className="account-empty"><strong>Nenhuma participação ativa.</strong><span>Quando você confirmar uma compra, ela aparecerá aqui.</span></div>
            ) : (
              <div className="account-list">
                {active.map((item) => {
                  const mine = participationNumbers(item.reservationId);
                  return (
                    <article className="account-raffle-card" key={item.id}>
                      <div className="account-card-image">{item.raffle.imageUrls[0] ? <img src={item.raffle.imageUrls[0]} alt={item.raffle.productName} /> : <span>Rifas.TOP</span>}</div>
                      <div className="account-card-content">
                        <span className="account-status status-active">Participação confirmada</span>
                        <h3>{item.raffle.productName}</h3>
                        <p>{item.raffle.name}{item.raffle.raffleCode ? " · ID " + item.raffle.raffleCode : ""}</p>
                        <div className="account-numbers"><span>Seus números</span><div>{mine.map((number) => <b key={number}>{formatNumber(number)}</b>)}</div></div>
                        <ResultNotice item={item} />
                        <div className="account-card-footer"><strong>{formatMoney(item.amountInCents)}</strong><span>{formatDate(item.approvedAt ?? item.createdAt)}</span></div>
                        <Link className="secondary-button account-button" href={"/rifa/" + item.raffle.id}>Ver rifa</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="account-section">
            <div className="account-section-heading">
              <div><span className="section-kicker">RESULTADOS</span><h2>Rifas finalizadas</h2></div>
              <span>{finished.length}</span>
            </div>
            {finished.length === 0 ? (
              <div className="account-empty"><strong>Nenhuma rifa finalizada ainda.</strong><span>Quando houver ganhador, o resultado ficará registrado aqui.</span></div>
            ) : (
              <div className="account-list">
                {finished.map((item) => {
                  const mine = participationNumbers(item.reservationId);
                  const winners = winningNumbers(item);
                  const won = winners.some((number) => mine.includes(number));
                  return (
                    <article className={"account-raffle-card account-finished-card" + (won ? " account-winner-card" : "")} key={item.id}>
                      <div className="account-card-image">{item.raffle.imageUrls[0] ? <img src={item.raffle.imageUrls[0]} alt={item.raffle.productName} /> : <span>Rifas.TOP</span>}</div>
                      <div className="account-card-content">
                        <span className={"account-status " + (won ? "status-winner" : "status-finished")}>{won ? "🎉 Você foi premiado!" : "Rifa finalizada"}</span>
                        <h3>{item.raffle.productName}</h3>
                        <p>{item.raffle.name}{item.raffle.raffleCode ? " · ID " + item.raffle.raffleCode : ""}</p>
                        <div className="account-numbers"><span>Seus números</span><div>{mine.map((number) => <b className={winners.includes(number) ? "winning-number" : ""} key={number}>{formatNumber(number)}</b>)}</div></div>
                        <ResultNotice item={item} />
                        <div className="account-card-footer"><strong>{formatMoney(item.amountInCents)}</strong><span>{item.raffle.resultPublishedAt ? "Resultado em " + formatDate(item.raffle.resultPublishedAt) : "Finalizada em " + formatDate(item.raffle.endDate ?? item.createdAt)}</span></div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {rejected.length > 0 && (
            <section className="account-section account-history-section">
              <div className="account-section-heading">
                <div><span className="section-kicker">HISTÓRICO</span><h2>Pagamentos não concluídos</h2></div>
                <span>{rejected.length}</span>
              </div>
              <div className="account-history-list">
                {rejected.map((item) => (
                  <div className="account-history-row" key={item.id}>
                    <div><strong>{item.raffle.productName}</strong><span>{item.raffle.name}</span></div>
                    <span>{formatMoney(item.amountInCents)}</span>
                    <b>Não concluído</b>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="account-section account-data-section">
            <div className="account-section-heading"><div><span className="section-kicker">MEUS DADOS</span><h2>Dados da conta</h2></div></div>
            <div className="account-info account-info-grid">
              <div><span>Nome completo</span><strong>{user.name}</strong></div>
              <div><span>Cidade</span><strong>{user.city}</strong></div>
              <div><span>Usuário</span><strong>{user.username}</strong></div>
              <div><span>WhatsApp / telefone</span><strong>{user.whatsapp}</strong></div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="secondary-button auth-logout" type="submit">Sair da conta</button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
