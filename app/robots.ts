import type { MetadataRoute } from "next";

const baseUrl = "https://rifastop.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/login",
        "/cadastro",
        "/minha-conta"
      ]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
