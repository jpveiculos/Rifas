import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import HomeRaffleBrowser from "@/app/HomeRaffleBrowser";
import SiteHeader from "@/app/SiteHeader";

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

  const whatsapp = siteSettings?.contactWhatsapp ?? "77998315360";

  return (
    <>
      <SiteHeader />

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

            <section className="quick-links-section home-quick-links">
              <div className="quick-links">
                <Link className="quick-link terms-link" href="/termos-de-uso">Termos de Uso</Link>
                <Link className="quick-link app-link" href="/baixar-app">Baixar Aplicativo</Link>
              </div>
            </section>

            <section className="social-links-section" aria-label="Redes sociais e contato">
              <div className="social-links">
                <a
                  className="social-link instagram-link"
                  href="https://instagram.com/_rifas.top"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
                <a
                  className="social-link whatsapp-link"
                  href={"https://wa.me/" + whatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </section>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>Coloque um item na Rifa</span>
          <a className="footer-contact" href={"https://wa.me/" + whatsapp} target="_blank" rel="noreferrer">
            Entrar em contato
          </a>
        </div>
      </footer>
    </>
  );
}
