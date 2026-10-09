import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/app/SiteFooter";

const siteDescription =
  "A RifasTOP é uma plataforma de rifas online que oferece sorteios de prêmios variados, incluindo veículos, eletrônicos e outros produtos. Consulte as rifas disponíveis, as regras de participação e os resultados dos sorteios, com informações claras sobre cada campanha.";

export const metadata: Metadata = {
  metadataBase: new URL("https://rifastop.com.br"),
  title: {
    default: "RifasTOP | Rifas Online e Sorteios de Prêmios",
    template: "%s | RifasTOP"
  },
  description: siteDescription,
  applicationName: "RifasTOP",
  alternates: {
    canonical: "https://rifastop.com.br"
  },
  openGraph: {
    title: "RifasTOP | Rifas Online e Sorteios de Prêmios",
    description: siteDescription,
    url: "https://rifastop.com.br",
    siteName: "RifasTOP",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/api/og-image",
        width: 1200,
        height: 675,
        alt: "RifasTOP — Rifas em Paramirim-BA e Região"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "RifasTOP | Rifas Online e Sorteios de Prêmios",
    description: siteDescription,
    images: ["/api/og-image"]
  },
  appleWebApp: {
    capable: true,
    title: "RifasTOP",
    statusBarStyle: "black-translucent"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}<SiteFooter /></body>
    </html>
  );
}
