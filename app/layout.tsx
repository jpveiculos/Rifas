import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rifas",
  description: "Plataforma de rifas pessoais"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}