"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type RaffleCardData = {
  id: string;
  raffleCode: string | null;
  name: string;
  city: string;
  topicName: string;
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
  isLoggedIn: boolean;
};

function formatNumber(value: number | string) {
  return String(value).padStart(5, "0");
}

function RaffleCard({
  raffle,
  finished = false,
  isLoggedIn,
  onParticipate
}: {
  raffle: RaffleCardData;
  finished?: boolean;
  isLoggedIn: boolean;
  onParticipate: (raffleId: string) => void;
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
          <button className="primary-button" type="button" onClick={() => onParticipate(raffle.id)}>
            Participar agora
          </button>
        )}
      </div>
    </article>
  );
}

function getTopicName(value: string) {
  return value.replace(/^rifas\s+em\s+/i, "").trim();
}

function getRaffleCity(raffle: RaffleCardData) {
  const city = getTopicName(raffle.topicName?.trim() || raffle.city?.trim());
  if (city) return city;
  const fallback = raffle.name.replace(/^rifa\s*/i, "").trim();
  return fallback || "Região";
}

function RaffleGroups({
  raffles,
  finished = false,
  isLoggedIn,
  onParticipate
}: {
  raffles: RaffleCardData[];
  finished?: boolean;
  isLoggedIn: boolean;
  onParticipate: (raffleId: string) => void;
}) {
  const groups = new Map<string, { city: string; raffles: RaffleCardData[] }>();

  for (const raffle of raffles) {
    const city = getRaffleCity(raffle);
    const key = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const current = groups.get(key);
    if (current) {
      current.raffles.push(raffle);
    } else {
      groups.set(key, { city, raffles: [raffle] });
    }
  }

  return (
    <div className="raffle-city-groups">
      {Array.from(groups.values()).map(({ city, raffles: cityRaffles }) => (
        <section className="raffle-city-group" key={city}>
          <div className="raffle-city-heading">
            <h3>Rifas em {city}</h3>
          </div>
          <div className="raffle-grid raffle-mosaic">
            {cityRaffles.map((raffle) => (
              <RaffleCard
                raffle={raffle}
                finished={finished}
                isLoggedIn={isLoggedIn}
                onParticipate={onParticipate}
                key={raffle.id}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type ModalMode = "login" | "register";

function AccessModal({
  raffleId,
  mode,
  onClose,
  onModeChange
}: {
  raffleId: string;
  mode: ModalMode;
  onClose: () => void;
  onModeChange: (mode: ModalMode) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { username, password }
        : { name, city, username, whatsapp, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? (mode === "login" ? "Não foi possível entrar." : "Não foi possível criar a conta."));
        return;
      }

      if (mode === "register") {
        setRegistered(true);
        setTimeout(onClose, 900);
      } else {
        window.location.href = "/rifa/" + raffleId;
      }
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="access-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="access-modal" role="dialog" aria-modal="true" aria-labelledby="access-modal-title">
        <button className="access-modal-close" type="button" aria-label="Fechar" onClick={onClose}>×</button>

        {registered ? (
          <div className="access-success">
            <strong>Cadastro realizado!</strong>
            <span>Sua conta foi criada. Você continuará na página principal.</span>
          </div>
        ) : (
          <>
            <span className="section-kicker">PARTICIPAR DA RIFA</span>
            <h2 id="access-modal-title">
              {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
            </h2>
            <p className="access-modal-text">
              {mode === "login"
                ? "Entre para continuar e participar desta rifa."
                : "Faça seu cadastro gratuito para participar das rifas."}
            </p>

            <form className="auth-form access-modal-form" onSubmit={submit}>
              {mode === "register" && (
                <>
                  <label>Nome completo<input required minLength={3} maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" /></label>
                  <label>Nome da cidade<input required minLength={2} maxLength={80} autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Sua cidade" /></label>
                  <label>Contato<input required inputMode="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp ou telefone" /></label>
                </>
              )}
              <label>Nome de usuário<input required minLength={3} maxLength={30} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex.: joao123" /></label>
              <label>Senha<input required minLength={4} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "login" ? "Sua senha" : "Crie sua senha"} /></label>
              <button className="primary-button" type="submit" disabled={loading}>
                {loading
                  ? (mode === "login" ? "Entrando..." : "Criando...")
                  : (mode === "login" ? "Entrar e participar" : "Criar minha conta")}
              </button>
            </form>

            {error && <div className="error-message">{error}</div>}

            <div className="access-switch">
              {mode === "login" ? (
                <>
                  <span>Ainda não tem cadastro?</span>
                  <button type="button" onClick={() => { setError(""); onModeChange("register"); }}>Criar conta</button>
                </>
              ) : (
                <>
                  <span>Já tem cadastro?</span>
                  <button type="button" onClick={() => { setError(""); onModeChange("login"); }}>Entrar</button>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function HomeRaffleBrowser({ activeRaffles, finishedRaffles, isLoggedIn }: Props) {
  const [accessRaffleId, setAccessRaffleId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("login");

  function handleParticipate(raffleId: string) {
    if (isLoggedIn) {
      window.location.href = "/rifa/" + raffleId;
      return;
    }

    setAccessRaffleId(raffleId);
    setModalMode("login");
  }

  return (
    <div className="home-raffle-browser">
      <RaffleGroups
        raffles={activeRaffles}
        isLoggedIn={isLoggedIn}
        onParticipate={handleParticipate}
      />

      {finishedRaffles.length > 0 && (
        <section className="finished-raffles">
          <div className="browser-results-heading">
            <div>
              <span className="section-kicker">RESULTADOS</span>
              <h3>Rifas finalizadas</h3>
            </div>
            <span>{finishedRaffles.length} finalizada{finishedRaffles.length === 1 ? "" : "s"}</span>
          </div>
          <RaffleGroups
            raffles={finishedRaffles}
            finished
            isLoggedIn={isLoggedIn}
            onParticipate={handleParticipate}
          />
        </section>
      )}

      {accessRaffleId && (
        <AccessModal
          raffleId={accessRaffleId}
          mode={modalMode}
          onClose={() => setAccessRaffleId(null)}
          onModeChange={setModalMode}
        />
      )}
    </div>
  );
}
