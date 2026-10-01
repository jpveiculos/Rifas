import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const baseUrl = "https://rifas.top";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const raffles = await prisma.raffle.findMany({
    where: { status: { in: ["ACTIVE", "ENDED"] } },
    select: { id: true, updatedAt: true }
  });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/termos-de-uso`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${baseUrl}/baixar-app`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];

  const rafflePages: MetadataRoute.Sitemap = raffles.map((raffle) => ({
    url: `${baseUrl}/rifa/${raffle.id}`,
    lastModified: raffle.updatedAt,
    changeFrequency: "daily",
    priority: 0.8
  }));

  return [...staticPages, ...rafflePages];
}
