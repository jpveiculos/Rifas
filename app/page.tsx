import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import HomeRaffleBrowser from "@/app/HomeRaffleBrowser";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { contactWhatsapp: true }
  });
  const raffles = await prisma.raffle.findMany({
    where: { status: { in: ["ACTIVE", "ENDED"] } },
    orderBy: { createdAt: "desc" },
    include: { topic: { select: { name: true } } }
  });

  const activeRaffles = raffles
    .filter((raffle) => raffle.status === "ACTIVE")
    .map((raffle) => ({
      id: raffle.id,
      raffleCode: raffle.raffleCode,
      name: raffle.name,
      city: raffle.city,
      topicName: raffle.topic?.name ?? raffle.city,
      productName: raffle.productName,
      description: raffle.description,
      imageUrls: raffle.imageUrls,
      priceInCents: raffle.priceInCents,
      winningNumber: raffle.winningNumber,
      winningNumbers: raffle.winningNumbers
    }));

  const finishedRaffles = raffles
    .filter((raffle) => raffle.status === "ENDED")
    .map((raffle) => ({
      id: raffle.id,
      raffleCode: raffle.raffleCode,
      name: raffle.name,
      city: raffle.city,
      topicName: raffle.topic?.name ?? raffle.city,
      productName: raffle.productName,
      description: raffle.description,
      imageUrls: raffle.imageUrls,
      priceInCents: raffle.priceInCents,
      winningNumber: raffle.winningNumber,
      winningNumbers: raffle.winningNumbers
    }));

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
              <Link className="header-login" href="/minha-conta">Minha Conta · {user.username}</Link>
            ) : (
              <Link className="header-login" href="/login">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="section raffle-section" id="rifas">
          <div className="container">
            {raffles.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhuma rifa publicada ainda.</h3>
                <p>As rifas criadas e ativadas no painel administrativo aparecerão aqui.</p>
              </div>
            ) : (
              <HomeRaffleBrowser activeRaffles={activeRaffles} finishedRaffles={finishedRaffles} />
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>Coloque um item na Rifa</span>
          <a className="footer-contact" href={"https://wa.me/" + (siteSettings?.contactWhatsapp ?? "77998315360")} target="_blank" rel="noreferrer">
            Entrar em contato
          </a>
        </div>
      </footer>
    </>
  );
}
