import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import HomeRaffleBrowser from "@/app/HomeRaffleBrowser";
import SiteHeader from "@/app/SiteHeader";
import { getSiteInstagramHandle } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { contactWhatsapp: true, heroImageUrl: true }
  });
  const instagramHandle = await getSiteInstagramHandle();
  const raffles = await prisma.raffle.findMany({
    where: { status: { in: ["ACTIVE", "ENDED"] } },
    orderBy: { createdAt: "desc" },
  });

  const activeRaffles = raffles
    .filter((raffle) => raffle.status === "ACTIVE")
    .map((raffle) => ({
      id: raffle.id,
      raffleCode: raffle.raffleCode,
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

      {siteSettings?.heroImageUrl ? (
        <section className="home-hero-banner" aria-label="Destaque da RifasTOP">
          <div className="home-hero-banner-inner">
            <img src={siteSettings.heroImageUrl} alt="RifasTOP — Rifas em Paramirim-BA e Região" />
          </div>
        </section>
      ) : null}

      <main>
        <section className="section raffle-section" id="rifas">
          <div className="container">
            {raffles.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhuma rifa publicada ainda.</h3>
                <p>As rifas criadas e ativadas no painel administrativo aparecerão aqui.</p>
              </div>
            ) : (
              <HomeRaffleBrowser activeRaffles={activeRaffles} finishedRaffles={finishedRaffles} isLoggedIn={Boolean(user)} />
            )}

            <section className="home-bottom-links" aria-label="Links e contato">
              <div className="home-bottom-links-row">
                <a
                  className="home-bottom-link instagram-link"
                  href={"https://instagram.com/" + instagramHandle}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="home-bottom-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor"/>
                  </svg>
                  <span>Instagram</span>
                </a>
                <a
                  className="home-bottom-link whatsapp-link"
                  href={"https://wa.me/" + whatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="home-bottom-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.5 11.6a8.4 8.4 0 0 1-12.45 7.3L4 20l1.15-3.85A8.4 8.4 0 1 1 20.5 11.6Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8.7 8.5c.25-.55.52-.56.76.34l.7 1.7c.1.23.07.42-.08.6l-.48.56c-.13.15-.27.3-.12.56.15.27.65 1.08 1.4 1.74.95.83 1.75 1.08 2.01 1.2.25.12.4.1.55-.08l.78-.92c.16-.2.34-.2.57-.12l1.65.78c.24.11.4.16.46.26.06.1.06.57-.14 1.1-.2.52-1.16 1-1.6 1.06-.41.05-.92.07-1.48-.1-.34-.1-.77-.25-1.33-.5-.56-.46-.56-1.27-.56-1.94 0-.67.35-1.3.49-1.47Z" fill="currentColor"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>
                <Link className="home-bottom-link terms-link" href="/termos-de-uso">Termos de Uso</Link>
                <Link className="home-bottom-link app-link" href="/baixar-app">Baixar Aplicativo</Link>
              </div>
            </section>

            <section className="quick-links-section home-quick-links">
              <div className="quick-links">
                <Link className="quick-link terms-link" href="/termos-de-uso">Termos de Uso</Link>
                <Link className="quick-link app-link" href="/baixar-app">Baixar Aplicativo</Link>
              </div>
            </section>
          </div>
        </section>
      </main>    </>
  );
}
