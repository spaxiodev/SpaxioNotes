import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date("2026-05-24");

  const homeAlternates = {
    en: siteUrl,
    fr: `${siteUrl}/fr`,
    "x-default": siteUrl,
  };

  const privacyAlternates = {
    en: `${siteUrl}/privacy`,
    fr: `${siteUrl}/fr/confidentialite`,
    "x-default": `${siteUrl}/privacy`,
  };

  const termsAlternates = {
    en: `${siteUrl}/terms`,
    fr: `${siteUrl}/fr/conditions`,
    "x-default": `${siteUrl}/terms`,
  };

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: homeAlternates },
    },
    {
      url: `${siteUrl}/fr`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: homeAlternates },
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
      alternates: { languages: privacyAlternates },
    },
    {
      url: `${siteUrl}/fr/confidentialite`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
      alternates: { languages: privacyAlternates },
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
      alternates: { languages: termsAlternates },
    },
    {
      url: `${siteUrl}/fr/conditions`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
      alternates: { languages: termsAlternates },
    },
  ];
}
