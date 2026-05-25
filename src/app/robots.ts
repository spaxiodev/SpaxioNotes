import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/fr", "/privacy", "/terms", "/fr/confidentialite", "/fr/conditions"],
      disallow: ["/app", "/api", "/auth", "/login", "/reset-password", "/fr/login", "/fr/reset-password"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
