import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RaffleParticipant from "./RaffleParticipant";
import ShareRaffle from "../ShareRaffle";

type Props = { params: Promise<{ id: string }> };

export default async function RafflePage({ params }: Props) {
  const { id } = await params;
  const raffle = await prisma.raffle.findUnique({ where: { id } });

  if (!raffle) notFound();

  const availableNumbers = await prisma.raffleNumber.count({
    where: { raffleId: id, status: "AVAILABLE" }
  });

  return (
    <>
      <header className="site-header"><div className="container site-header-inner">
        <Link className="brand" href="/">Rifas</Link>
        <Link className="header-link" href="/">Voltar</Link>
      </div></header>
      <main className="section"><div className="container">
        <article className="raffle-card"><div className="raffle-card-content">
          <span className="badge">{raffle.status}</span>
          <h1>{raffle.name}</h1>
          <h3>{raffle.productName}</h3>
          <p>{raffle.description}</p>
          <div className="info-row">
            <div className="info-item"><span className="info-label">Preço por número</span><span className="info-value">{(raffle.priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
            <div className="info-item"><span className="info-label">Data do sorteio</span><span className="info-value">{raffle.endDate ? new Date(raffle.endDate).toLocaleString("pt-BR") : "Será divulgada posteriormente"}</span></div>
          </div>
          <RaffleParticipant raffleId={raffle.id} priceInCents={raffle.priceInCents} />
          <ShareRaffle raffleName={raffle.name} />
        </div></article>
      </div></main>
    </>
  );
}