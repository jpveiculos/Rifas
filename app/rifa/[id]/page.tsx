import Link from "next/link";
import { notFound } from "next/navigation";
import { raffles } from "@/lib/raffles";

type Props = { params: Promise<{ id: string }> };

export default async function RafflePage({ params }: Props) {
  const { id } = await params;
  const raffle = raffles.find((item) => item.id === id);
  if (!raffle) notFound();

  return (
    <>
      <header className="site-header"><div className="container site-header-inner">
        <Link className="brand" href="/">Rifas</Link><Link className="header-link" href="/">Voltar</Link>
      </div></header>
      <main className="section"><div className="container">
        <article className="raffle-card"><div className="raffle-card-content">
          <span className="badge">{raffle.status}</span>
          <h1>{raffle.name}</h1><h3>{raffle.productName}</h3><p>{raffle.description}</p>
          <div className="info-row">
            <div className="info-item"><span className="info-label">Total de números</span><span className="info-value">{raffle.totalNumbers.toLocaleString("pt-BR")}</span></div>
            <div className="info-item"><span className="info-label">Preço por número</span><span className="info-value">{raffle.pricePerNumber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
          </div>
          <div className="empty-state"><h3>Escolha a quantidade</h3><p>O sistema vai gerar automaticamente somente números disponíveis. Não haverá uma lista gigante de números para procurar.</p></div>
        </div></article>
      </div></main>
    </>
  );
}