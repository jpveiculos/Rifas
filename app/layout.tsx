import type { Metadata } from "next";
import "./globals.css";
import "./rifastop-brand.css";

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
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "RifasTOP",
    description: "Plataforma de Rifas"
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
      <body>{children}</body>
    </html>
  );
}
