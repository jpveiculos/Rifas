"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ShareRaffle from "@/app/rifa/ShareRaffle";
import { RAFFLE_CATEGORIES } from "@/lib/raffle-categories";

type RaffleCardData = {
  id: string;
  raffleCode: string | null;
  name: string;
  productName: string;
  category: string;
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

const INITIAL_VISIBLE = 6;

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
          <>
            <Link className="primary-button" href={"/rifa/" + raffle.id}>Escolher números</Link>
            <ShareRaffle raffleName={raffle.name} />
          </>
        )}
      </div>
    </article>
  );
}

export default function HomeRaffleBrowser({ activeRaffles, finishedRaffles }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [categorySearch, setCategorySearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const raffle of activeRaffles) {
      counts.set(raffle.category, (counts.get(raffle.category) || 0) + 1);
    }
    return counts;
  }, [activeRaffles]);

  const filteredCategories = useMemo(() => {
    const term = categorySearch.trim().toLocaleLowerCase("pt-BR");
    return RAFFLE_CATEGORIES.filter((category) =>
      !term || category.toLocaleLowerCase("pt-BR").includes(term)
    );
  }, [categorySearch]);

  const filteredRaffles = useMemo(() => {
    if (selectedCategory === "TODAS") return activeRaffles;
    return activeRaffles.filter((raffle) => raffle.category === selectedCategory);
  }, [activeRaffles, selectedCategory]);

  const visibleRaffles = filteredRaffles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRaffles.length;

  function chooseCategory(category: string) {
    setSelectedCategory(category);
    setVisibleCount(INITIAL_VISIBLE);
  }

  return (
    <div className="home-raffle-browser">
      {activeRaffles.length > 0 && (
        <section className="featured-raffles">
          <div className="browser-heading">
            <div>
              <span className="section-kicker">EM DESTAQUE</span>
              <h3>Rifas ativas</h3>
              <p>Algumas rifas em andamento aparecem aqui. Use as categorias para encontrar as demais.</p>
            </div>
            <span className="raffle-count">{activeRaffles.length} ativa{activeRaffles.length === 1 ? "" : "s"}</span>
          </div>
          <div className="raffle-grid featured-raffle-grid">
            {activeRaffles.slice(0, INITIAL_VISIBLE).map((raffle) => (
              <RaffleCard raffle={raffle} key={raffle.id} />
            ))}
          </div>
        </section>
      )}

      <section className="category-browser">
        <div className="browser-heading">
          <div>
            <span className="section-kicker">ENCONTRE SUA RIFA</span>
            <h3>Escolha uma categoria</h3>
            <p>Selecione uma categoria para abrir um mosaico somente com as rifas ativas daquele tipo.</p>
          </div>
        </div>

        <div className="category-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            placeholder="Pesquisar categoria..."
            aria-label="Pesquisar categoria"
          />
          {categorySearch && (
            <button type="button" onClick={() => setCategorySearch("")} aria-label="Limpar pesquisa">
              ×
            </button>
          )}
        </div>

        <div className="category-menu" aria-label="Categorias de rifas">
          <button
            type="button"
            className={"category-chip " + (selectedCategory === "TODAS" ? "category-chip-active" : "")}
            onClick={() => chooseCategory("TODAS")}
          >
            <strong>Todas</strong>
            <span>{activeRaffles.length}</span>
          </button>

          {filteredCategories.map((category) => {
            const count = categoryCounts.get(category) || 0;
            return (
              <button
                type="button"
                key={category}
                className={"category-chip " + (selectedCategory === category ? "category-chip-active" : "") + (count === 0 ? " category-chip-empty" : "")}
                onClick={() => chooseCategory(category)}
              >
                <strong>{category}</strong>
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="browser-results-heading">
          <div>
            <span className="section-kicker">RESULTADOS</span>
            <h3>{selectedCategory === "TODAS" ? "Todas as rifas ativas" : selectedCategory}</h3>
          </div>
          <span>{filteredRaffles.length} {filteredRaffles.length === 1 ? "resultado" : "resultados"}</span>
        </div>

        {filteredRaffles.length === 0 ? (
          <div className="empty-state category-empty-state">
            <h3>Nenhuma rifa ativa nesta categoria.</h3>
            <p>Escolha outra categoria para ver as rifas disponíveis.</p>
          </div>
        ) : (
          <>
            <div className="raffle-grid raffle-mosaic">
              {visibleRaffles.map((raffle) => (
                <RaffleCard raffle={raffle} key={raffle.id} />
              ))}
            </div>
            {hasMore && (
              <button className="show-more-button" type="button" onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE)}>
                Mostrar mais rifas
              </button>
            )}
          </>
        )}
      </section>

      {finishedRaffles.length > 0 && (
        <section className="finished-raffles">
          <div className="browser-results-heading">
            <div>
              <span className="section-kicker">RESULTADOS</span>
              <h3>Rifas finalizadas</h3>
            </div>
            <span>{finishedRaffles.length} finalizada{finishedRaffles.length === 1 ? "" : "s"}</span>
          </div>
          <div className="raffle-grid finished-raffle-grid">
            {finishedRaffles.slice(0, INITIAL_VISIBLE).map((raffle) => (
              <RaffleCard raffle={raffle} finished key={raffle.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
