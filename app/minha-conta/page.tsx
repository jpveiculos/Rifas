import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SiteHeader from "@/app/SiteHeader";
import PaymentCountdown from "./PaymentCountdown";

export const dynamic = "force-dynamic";

function formatNumber(value: number | string) {
  return String(value).padStart(4, "0");
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

  const reservationCutoff = new Date(Date.now() - 30 * 60 * 1000);

  const expiredReservations = await prisma.raffleNumber.findMany({
    where: {
      reservedByUserId: user.id,
      status: "RESERVED",
      reservedAt: { lt: reservationCutoff }
    },
    select: { reservationId: true }
  });

  const expiredReservationIds = expiredReservations
    .map((item) => item.reservationId)
    .filter((value): value is string => Boolean(value));

  if (expiredReservationIds.length > 0) {
    await prisma.$transaction([
      prisma.raffleNumber.updateMany({
        where: {
          reservedByUserId: user.id,
          status: "RESERVED",
          reservationId: { in: expiredReservationIds }
        },
        data: {
          status: "AVAILABLE",
          reservationId: null,
          reservedAt: null,
          reservedByUserId: null
        }
      }),
      prisma.raffleParticipation.updateMany({
        where: {
          userId: user.id,
          status: "PENDING",
          reservationId: { in: expiredReservationIds }
        },
        data: {
          status: "REJECTED",
          mercadopagoStatus: "expired",
          mercadopagoStatusDetail: "Reserva expirada após 30 minutos sem pagamento."
        }
      })
    ]);
  }

  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { contactWhatsapp: true }
  });

  const participations = await prisma.raffleParticipation.findMany({
    where: {
      userId: user.id,
      status: { in: ["PENDING", "APPROVED"] },
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
      status: { in: ["RESERVED", "CONFIRMED"] },
      raffle: { status: "ACTIVE" }
    },
    select: {
      number: true,
      reservationId: true,
      status: true,
      reservedAt: true
    },
    orderBy: { number: "asc" }
  });

  const numbersByReservation = new Map<string, {
    numbers: number[];
    status: "RESERVED" | "CONFIRMED";
    reservedAt: Date | null;
  }>();
  for (const item of numbers) {
    const key = item.reservationId ?? "";
    const current: {
      numbers: number[];
      status: "RESERVED" | "CONFIRMED";
      reservedAt: Date | null;
    } = numbersByReservation.get(key) ?? {
      numbers: [],
      status: item.status === "RESERVED" ? "RESERVED" : "CONFIRMED",
      reservedAt: item.reservedAt
    };
    current.numbers.push(item.number);
    if (item.status === "RESERVED") current.status = "RESERVED";
    if (item.reservedAt && (!current.reservedAt || item.reservedAt < current.reservedAt)) {
      current.reservedAt = item.reservedAt;
    }
    numbersByReservation.set(key, current);
  }

  const productGroups = new Map<string, typeof participations>();
  for (const participation of participations) {
    const productName = (participation.raffle.productName || participation.raffle.name || "Rifa").trim();
    const key = productName.toLocaleLowerCase("pt-BR");
    const group = productGroups.get(key) ?? [];
    group.push(participation);
    productGroups.set(key, group);
  }

  const groupedParticipations = [...productGroups.entries()]
    .map(([key, items]) => ({
      key,
      productName: items[0]?.raffle.productName || items[0]?.raffle.name || "Rifa",
      items: items.filter((item) => item.status !== "PENDING")
    }))
    .filter((group) => group.items.length > 0)
    .sort((a, b) => {
      const dateA = a.items[0]?.createdAt?.getTime?.() ?? 0;
      const dateB = b.items[0]?.createdAt?.getTime?.() ?? 0;
      return dateB - dateA;
    });

  const pendingParticipations = participations.filter((item) => item.status === "PENDING");

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
    return [...(numbersByReservation.get(reservationId)?.numbers ?? [])].sort((a, b) => a - b);
  }

  return (
    <>
      <SiteHeader />

      <main className="account-page account-page-clean">
        <div className="container account-container">
          {pendingParticipations.length > 0 && (
            <section className="account-pending-section">
              <details className="account-pending-menu">
                <summary className="account-pending-summary">
                  <div>
                    <span className="section-kicker">ATENÇÃO</span>
                    <strong>Pagamentos pendentes</strong>
                    <span>{pendingParticipations.length} {pendingParticipations.length === 1 ? "compra aguardando pagamento" : "compras aguardando pagamento"}</span>
                  </div>
                  <span className="account-pending-open">Ver agora</span>
                </summary>

                <div className="account-pending-list">
                  {pendingParticipations.map((item) => {
                    const reservation = numbersByReservation.get(item.reservationId);
                    const mine = participationNumbers(item.reservationId);
                    const paymentExpiresAt = item.mercadopagoExpiresAt
                      ? item.mercadopagoExpiresAt.toISOString()
                      : new Date(item.createdAt.getTime() + 30 * 60 * 1000).toISOString();

                    return (
                      <article className="account-pending-card" key={item.id}>
                        <div className="account-pending-card-image">
                          {item.raffle.imageUrls[0] ? (
                            <img src={item.raffle.imageUrls[0]} alt={item.raffle.productName} />
                          ) : (
                            <span>RifasTOP</span>
                          )}
                        </div>
                        <div className="account-pending-card-content">
                          <div className="account-status-row">
                            <span className="account-status status-pending">Aguardando pagamento</span>
                          </div>
                          <h3>{item.raffle.productName}</h3>
                          <p>
                            {item.raffle.name}
                            {item.raffle.raffleCode ? " · ID " + item.raffle.raffleCode : ""}
                          </p>
                          <div className="account-numbers">
                            <span>Números reservados</span>
                            <div>{mine.map((number) => <b key={number}>{formatNumber(number)}</b>)}</div>
                          </div>
                          <div className="account-pending-payment">
                            <strong>Pagamento pendente</strong>
                            <span>
<PaymentCountdown expiresAt={paymentExpiresAt} />
                            </span>
                            {item.mercadopagoQrCodeBase64 && (
                              <details className="payment-qr-details">
                                <summary className="secondary-button account-button payment-link">Pagar agora</summary>
                                <img
                                  className="payment-qr"
                                  src={"data:image/png;base64," + item.mercadopagoQrCodeBase64}
                                  alt="QR Code para pagamento Pix"
                                />
                              </details>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </details>
            </section>
          )}

          <section className="account-section account-participations">
            <div className="account-section-heading">
              <div className="account-title-card">
                <h1>Minhas Rifas</h1>
              </div>
            </div>

            {participations.length === 0 ? (
              <div className="account-empty">
                <strong>Você ainda não está participando de nenhuma rifa.</strong>
                <span>Escolha uma rifa para participar e seus números aparecerão aqui.</span>
              </div>
            ) : (
              <div className="account-product-list">
                {groupedParticipations.map((group) => {
                  const first = group.items[0];
                  const imageUrl = first?.raffle.imageUrls[0];
                  const totalNumbers = group.items.reduce((total, item) => total + participationNumbers(item.reservationId).length, 0);
                  const pendingCount = group.items.filter((item) => item.status === "PENDING").length;

                  return (
                    <details className="account-product-group" key={group.key}>
                      <summary className="account-product-summary">
                        <div className="account-product-image">
                          {imageUrl ? (
                            <img src={imageUrl} alt={group.productName} />
                          ) : (
                            <span>RifasTOP</span>
                          )}
                        </div>
                        <div className="account-product-info">
                          <strong>{group.productName}</strong>
                          <span>
                            {group.items.length} {group.items.length === 1 ? "compra" : "compras"} · {totalNumbers} {totalNumbers === 1 ? "número" : "números"}
                          </span>
                          {pendingCount > 0 && (
                            <small>{pendingCount} {pendingCount === 1 ? "pagamento pendente" : "pagamentos pendentes"}</small>
                          )}
                        </div>
                        <span className="account-product-open">Abrir</span>
                      </summary>

                      <div className="account-product-purchases">
                        {group.items.map((item) => {
                          const reservation = numbersByReservation.get(item.reservationId);
                          const mine = participationNumbers(item.reservationId);
                          const isPending = item.status === "PENDING";
                          const isBonus = item.mercadopagoStatus === "bonus";
                          const paymentExpiresAt = item.mercadopagoExpiresAt
                            ? item.mercadopagoExpiresAt.toISOString()
                            : new Date(item.createdAt.getTime() + 30 * 60 * 1000).toISOString();

                          return (
                            <article className="account-raffle-card" key={item.id}>
                              <div className="account-card-image">
                                {item.raffle.imageUrls[0] ? (
                                  <img src={item.raffle.imageUrls[0]} alt={item.raffle.productName} />
                                ) : (
                                  <span>RifasTOP</span>
                                )}
                              </div>
                              <div className="account-card-content">
                                <div className="account-status-row">
                                  <span className={"account-status " + (isPending ? "status-pending" : "status-active")}>
                                    {isPending ? "Aguardando pagamento" : isBonus ? "Bônus da plataforma" : "Participando"}
                                  </span>
                                  {isBonus && <span className="account-bonus-badge">🎁 Números bônus</span>}
                                </div>
                                <h3>{item.raffle.productName}</h3>
                                <p>
                                  {item.raffle.name}
                                  {item.raffle.raffleCode ? " · ID " + item.raffle.raffleCode : ""}
                                </p>
                                {isBonus && (
                                  <div className="account-bonus-message">
                                    🎁 <strong>Você recebeu estes números como bônus da plataforma.</strong>
                                    <span>Não houve cobrança por esta participação.</span>
                                  </div>
                                )}
                                <div className="account-numbers">
                                  <span>{isPending ? "Números reservados" : "Seus números"}</span>
                                  <div>
                                    {mine.map((number) => (
                                      <b key={number}>{formatNumber(number)}</b>
                                    ))}
                                  </div>
                                </div>

                                {isPending && (
                                  <div className="account-pending-payment">
                                    <strong>Pagamento pendente</strong>
                                    <span>
<PaymentCountdown expiresAt={paymentExpiresAt} />
                                    </span>

                                    {item.mercadopagoQrCodeBase64 && (
                                      <details className="payment-qr-details">
                                        <summary className="secondary-button account-button payment-link">
                                          Pagar agora
                                        </summary>
                                        <img
                                          className="payment-qr"
                                          src={"data:image/png;base64," + item.mercadopagoQrCodeBase64}
                                          alt="QR Code para pagamento Pix"
                                        />
                                      </details>
                                    )}
                                  </div>
                                )}

                                {!isPending && (
                                  <Link className="secondary-button account-button" href={"/rifa/" + item.raffle.id}>
                                    Ver rifa
                                  </Link>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </details>
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
        </div>
      </main>

    </>
  );
}
