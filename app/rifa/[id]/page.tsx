import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RaffleParticipant from "./RaffleParticipant";
import ShareRaffle from "../ShareRaffle";
import { getCurrentUser } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

function formatNumber(value: number | string) {
  return String(value).padStart(5, "0");
}

export default async function RafflePage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  const raffle = await prisma.raffle.findUnique({ where: { id } });

  if (!raffle) notFound();

  const winningNumbers = raffle.winningNumbers.length > 0
    ? raffle.winningNumbers
    : raffle.winningNumber !== null
      ? [raffle.winningNumber]
      : [];

  return (
    <>
      <header className="site-header"><div className="container site-header-inner">
        <Link className="brand" href="/"><span>Rifas<span className="brand-dot">.</span><strong>TOP</strong></span></Link>
        <Link className="header-link" href={user ? "/minha-conta" : "/"}>← Voltar</Link>
      </div></header>

      <main className="section"><div className="container">
        <article className="raffle-card"><div className="raffle-card-content">
          <span className={"badge " + (raffle.status === "ENDED" ? "badge-finished" : "")}>
            {raffle.status === "ENDED" ? "SORTEIO FINALIZADO" : raffle.status === "ACTIVE" ? "EM ANDAMENTO" : raffle.status}
          </span>

          <h1>{raffle.name}</h1>
          {raffle.raffleCode && <div className="raffle-code-public raffle-code-detail">ID {raffle.raffleCode}</div>}
          {raffle.imageUrls.length > 0 && <div className="raffle-gallery">{raffle.imageUrls.map((url) => <img key={url} src={url} alt={raffle.productName} />)}</div>}
          <h3>{raffle.productName}</h3>
          <p>{raffle.description}</p>

          <div className="info-row">
            <div className="info-item"><span className="info-label">Preço por número</span><span className="info-value">{(raffle.priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
            <div className="info-item"><span className="info-label">Data do sorteio</span><span className="info-value">{raffle.endDate ? new Date(raffle.endDate).toLocaleString("pt-BR") : "Será divulgada posteriormente"}</span></div>
          </div>



          {raffle.status === "ENDED" && winningNumbers.length > 0 && (
            <div className="account-result account-result-winner">
              <span>Número(s) vencedor(es)</span>
              <strong>{winningNumbers.map(formatNumber).join(" · ")}</strong>
              <small>Resultado publicado em {raffle.resultPublishedAt ? new Date(raffle.resultPublishedAt).toLocaleString("pt-BR") : "data não informada"}.</small>
            </div>
          )}

          {raffle.status === "ACTIVE" && <RaffleParticipant raffleId={raffle.id} priceInCents={raffle.priceInCents} />}
          <ShareRaffle raffleName={raffle.name} />
        </div></article>
      </div></main>
    </>
  );
}
