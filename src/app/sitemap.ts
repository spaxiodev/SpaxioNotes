import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date("2026-05-24");

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${siteUrl}/en`,
          fr: siteUrl,
        },
      },
    },
    {
      url: `${siteUrl}/en`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          en: `${siteUrl}/en`,
          fr: siteUrl,
        },
      },
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
      alternates: {
        languages: {
          en: `${siteUrl}/privacy`,
          fr: `${siteUrl}/fr/confidentialite`,
        },
      },
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
      alternates: {
        languages: {
          en: `${siteUrl}/terms`,
          fr: `${siteUrl}/fr/conditions`,
        },
      },
    },
    {
      url: `${siteUrl}/fr/confidentialite`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${siteUrl}/privacy`,
          fr: `${siteUrl}/fr/confidentialite`,
        },
      },
    },
    {
      url: `${siteUrl}/fr/conditions`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${siteUrl}/terms`,
          fr: `${siteUrl}/fr/conditions`,
        },
      },
    },
  ];
}
