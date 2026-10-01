import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rifas.TOP",
  description: "Plataforma de Rifas",
  applicationName: "Rifas.TOP",
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
