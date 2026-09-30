import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rifas.top",
  description: "Plataforma de rifas pessoais",
  applicationName: "Rifas.top",
  appleWebApp: {
    capable: true,
    title: "Rifas.top",
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
