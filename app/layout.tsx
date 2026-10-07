import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/app/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://rifastop.com.br"),
  title: "RifasTOP",
  description: "Plataforma de Rifas",
  applicationName: "RifasTOP",
  alternates: {
    canonical: "https://rifastop.com.br"
  },
  openGraph: {
    title: "RifasTOP",
    description: "Plataforma de Rifas",
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
    title: "RifasTOP",
    description: "Plataforma de Rifas",
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
