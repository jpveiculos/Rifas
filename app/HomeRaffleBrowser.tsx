"use client";

import Link from "next/link";

type RaffleCardData = {
  id: string;
  raffleCode: string | null;
  name: string;
  city: string;
  productName: string;
  description: string;
  imageUrls: string[];
  priceInCents: number;
  winningNumber: number | null;
  winningNumbers: number[];
};

type Props = {
  activeRaffles: RaffleCardData[];
  finishedRaffles: RaffleCardData[];
};

function formatNumber(value: number | string) {
  return String(value).padStart(5, "0");
}

function RaffleCard({
  raffle,
  finished = false
}: {
  raffle: RaffleCardData;
  finished?: boolean;
}) {
  const winningNumbers = raffle.winningNumbers?.length > 0
    ? raffle.winningNumbers
    : raffle.winningNumber !== null
      ? [raffle.winningNumber]
      : [];

  return (
    <article className="raffle-card">
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
            <span>Número sorteado</span>
            <strong>{winningNumbers.map(formatNumber).join(" · ")}</strong>
            <small>Rifa finalizada com ganhador.</small>
          </div>
        )}

        <div className="card-price">
          {(raffle.priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          <small> por número</small>
        </div>

        <div className="raffle-meta">
          <span>{finished ? "● Finalizada" : "● Ativa"}</span>
        </div>

        {finished ? (
          <Link className="primary-button" href={"/rifa/" + raffle.id}>Ver resultado</Link>
        ) : (
          <Link className="primary-button" href={"/rifa/" + raffle.id}>Participar agora</Link>
        )}
      </div>
    </article>
  );
}

function getRaffleCity(raffle: RaffleCardData) {
  const city = raffle.city?.trim();
  if (city) return city;
  const fallback = raffle.name.replace(/^rifa\s*/i, "").trim();
  return fallback || "Região";
}

function RaffleGroups({
  raffles,
  finished = false
}: {
  raffles: RaffleCardData[];
  finished?: boolean;
}) {
  const groups = new Map<string, RaffleCardData[]>();

  for (const raffle of raffles) {
    const city = getRaffleCity(raffle);
    const current = groups.get(city) ?? [];
    current.push(raffle);
    groups.set(city, current);
  }

  return (
    <div className="raffle-city-groups">
      {Array.from(groups.entries()).map(([city, cityRaffles]) => (
        <section className="raffle-city-group" key={city}>
          <div className="raffle-city-heading">
            <span>RIFAS EM</span>
            <h3>{city}</h3>
          </div>
          <div className="raffle-grid raffle-mosaic">
            {cityRaffles.map((raffle) => (
              <RaffleCard raffle={raffle} finished={finished} key={raffle.id} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function HomeRaffleBrowser({ activeRaffles, finishedRaffles }: Props) {
  return (
    <div className="home-raffle-browser">
      <RaffleGroups raffles={activeRaffles} />

      {finishedRaffles.length > 0 && (
        <section className="finished-raffles">
          <div className="browser-results-heading">
            <div>
              <span className="section-kicker">RESULTADOS</span>
              <h3>Rifas finalizadas</h3>
            </div>
            <span>{finishedRaffles.length} finalizada{finishedRaffles.length === 1 ? "" : "s"}</span>
          </div>
          <RaffleGroups raffles={finishedRaffles} finished />
        </section>
      )}
    </div>
  );
}
