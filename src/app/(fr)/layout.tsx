import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { PrivacyConsent } from "@/components/privacy-consent";
import { getSiteUrl } from "@/lib/url";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Spaxio Assistant | Notes IA, calendrier et rappels",
    template: "%s | Spaxio Assistant",
  },
  description:
    "Spaxio Assistant transforme le texte et la parole en notes IA, evenements de calendrier, rappels, taches et memoire de travail consultable.",
  keywords: [
    "notes IA",
    "calendrier IA",
    "rappels IA",
    "parole vers notes",
    "parole vers calendrier",
    "notes vocales",
    "planificateur IA",
    "gestionnaire de taches IA",
    "rappels de calendrier",
    "application de prise de notes",
    "memoire de travail",
    "Spaxio Assistant",
  ],
  applicationName: "Spaxio Assistant",
  authors: [{ name: "Spaxio Assistant" }],
  creator: "Spaxio Assistant",
  publisher: "Spaxio Assistant",
  alternates: {
    canonical: "/fr",
  },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/fr",
    siteName: "Spaxio Assistant",
    locale: "fr_CA",
    alternateLocale: "en_CA",
    title: "Spaxio Assistant | Notes IA, calendrier et rappels",
    description:
      "Capturez des idees par texte ou par parole et transformez-les en notes, rappels, taches, calendrier et memoire de travail consultable.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "Spaxio Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spaxio Assistant | Notes IA, calendrier et rappels",
    description: "Parole vers notes, calendrier et rappels dans un espace de travail IA.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FrenchRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr-CA"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <PrivacyConsent />
      </body>
    </html>
  );
}
