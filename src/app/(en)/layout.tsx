import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { MetaPixel, META_PIXEL_SCRIPT } from "@/components/meta-pixel";
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
    default: "Spaxio Assistant | AI notes, calendar, and reminders",
    template: "%s | Spaxio Assistant",
  },
  description:
    "Spaxio Assistant turns text and speech into AI notes, calendar events, reminders, tasks, and searchable workspace memory.",
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
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Spaxio Assistant",
    locale: "en_CA",
    alternateLocale: "fr_CA",
    title: "Spaxio Assistant | AI notes, calendar, and reminders",
    description:
      "Capture ideas by text or speech and turn them into notes, reminders, tasks, calendar events, and a searchable workspace memory.",
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
    title: "Spaxio Assistant | AI notes, calendar, and reminders",
    description: "Speech to notes, calendar, and reminders in an AI workspace.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EnglishRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-CA"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: META_PIXEL_SCRIPT,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <MetaPixel />
        <PrivacyConsent />
      </body>
    </html>
  );
}
