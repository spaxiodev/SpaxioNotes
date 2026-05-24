import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { PrivacyConsent } from "@/components/privacy-consent";
import { getSiteUrl } from "@/lib/url";

import "./globals.css";

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
    "AI calendar",
    "AI notes",
    "AI reminders",
    "speech to notes",
    "speech to calendar",
    "speech to reminders",
    "voice notes",
    "AI planner",
    "AI task manager",
    "calendar reminders",
    "note taking app",
    "memory workspace",
    "Spaxio Assistant",
  ],
  applicationName: "Spaxio Assistant",
  authors: [{ name: "Spaxio Assistant" }],
  creator: "Spaxio Assistant",
  publisher: "Spaxio Assistant",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Spaxio Assistant",
    title: "Spaxio Assistant | Notes IA, calendrier et rappels",
    description:
      "Capturez des idees par texte ou par parole et transformez-les en notes, rappels, taches, calendrier et memoire de travail consultable.",
  },
  twitter: {
    card: "summary",
    title: "Spaxio Assistant | Notes IA, calendrier et rappels",
    description:
      "Parole vers notes, calendrier et rappels dans un espace de travail IA.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
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
