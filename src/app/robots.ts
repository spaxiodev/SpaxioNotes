import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/en", "/privacy", "/terms", "/fr/confidentialite", "/fr/conditions"],
      disallow: ["/app", "/api", "/auth", "/login", "/reset-password"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
