import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rifastop.com.br"),
  title: "Rifas.TOP",
  description: "Plataforma de Rifas",
  applicationName: "Rifas.TOP",
  alternates: {
    canonical: "https://rifastop.com.br"
  },
  openGraph: {
    title: "Rifas.TOP",
    description: "Plataforma de Rifas",
    url: "https://rifastop.com.br",
    siteName: "Rifas.TOP",
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Rifas.TOP",
    description: "Plataforma de Rifas"
  },
  appleWebApp: {
    capable: true,
    title: "Rifas.TOP",
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
