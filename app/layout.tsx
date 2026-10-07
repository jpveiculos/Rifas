import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/app/SiteFooter";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { heroImageUrl: true }
  });

  const heroImage = settings?.heroImageUrl
    ? { url: "/api/site-hero", width: 1200, height: 628, alt: "RifasTOP — Rifas em Paramirim-BA e Região" }
    : undefined;

  return {
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
      ...(heroImage ? { images: [heroImage] } : {})
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title: "RifasTOP",
      description: "Plataforma de Rifas",
      ...(heroImage ? { images: [heroImage.url] } : {})
    },
    appleWebApp: {
      capable: true,
      title: "RifasTOP",
      statusBarStyle: "black-translucent"
    }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}<SiteFooter /></body>
    </html>
  );
}
