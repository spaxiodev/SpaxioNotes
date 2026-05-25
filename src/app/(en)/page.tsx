import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Bell, Brain, CalendarClock, CreditCard, Database, Lock, Mic2, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { getSiteUrl } from "@/lib/url";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      fr: "/fr",
      "x-default": "/",
    },
  },
};

export default function EnglishLandingPage() {
  const siteUrl = getSiteUrl();
  const referralRules = [
    "Each invite code can be used by one new friend.",
    "When your friend joins, your code is marked used and a fresh invite link is generated.",
    "You get Pro at CA$10/mo for the first referral month, then keep that price by inviting one new person each month.",
    "Friends start at CA$15/mo until they invite someone with their own link.",
  ];
  const faqs = [
    [
      "How does the invite discount work?",
      "Your invite link gives you the CA$10/mo referral price after one new person joins. That person starts at the standard CA$15/mo Pro price.",
    ],
    [
      "Can one invite code be used more than once?",
      "No. Each invite code is single-use. After it is used successfully, your account receives a new invite link.",
    ],
    [
      "How do I keep the CA$10 monthly price?",
      "Invite one new person each month. If no new person joins during the referral month, the standard CA$15/mo Pro price applies.",
    ],
    [
      "What does Pro include?",
      "Pro unlocks voice-first AI capture features and Stripe-managed subscription access for the app.",
    ],
  ];
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Spaxio Assistant",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "AI workspace for voice notes, calendar, reminders, task planning, and searchable memory.",
    offers: [
      {
        "@type": "Offer",
        name: "Spaxio Assistant Free",
        price: "0",
        priceCurrency: "CAD",
      },
      {
        "@type": "Offer",
        name: "Spaxio Assistant Pro",
        price: "15",
        priceCurrency: "CAD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "15",
          priceCurrency: "CAD",
          billingDuration: "P1M",
        },
      },
    ],
    featureList: [
      "AI notes",
      "AI calendar",
      "AI reminders",
      "Speech to notes",
      "Speech to calendar",
      "Speech to reminders",
      "Task planning",
      "Workspace memory",
    ],
  };

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-zinc-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <section className="flex min-h-screen w-full flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 sm:pb-5">
          <Link className="flex items-center gap-3" href="/">
            <BrandLogo className="border border-zinc-200" />
            <div>
              <p className="text-base font-semibold leading-none sm:text-lg">Spaxio Assistant</p>
              <p className="mt-1 text-xs text-zinc-500">AI workspace</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-950 md:inline" href="/privacy">
              Privacy
            </Link>
            <Link className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-950 md:inline" href="/terms">
              Terms
            </Link>
            <div aria-label="Change language" className="flex h-9 items-center rounded-md border border-zinc-200 bg-white p-1 sm:h-10">
              <span className="inline-flex h-7 items-center justify-center rounded-sm bg-zinc-950 px-2.5 text-xs font-medium text-white sm:h-8 sm:px-3 sm:text-sm">
                EN
              </span>
              <Link
                className="inline-flex h-7 items-center justify-center rounded-sm px-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 sm:h-8 sm:px-3 sm:text-sm"
                href="/fr"
                hrefLang="fr"
              >
                FR
              </Link>
            </div>
            <Link className="primary-button" href="/login">
              Sign in
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_460px]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">AI workspace</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-5xl lg:text-6xl xl:text-7xl">
              AI notes, calendar, and reminders from everyday context.
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8 lg:text-xl">
              Spaxio Assistant turns written notes and speech into searchable memory, tasks, calendar events, and reminders for school,
              client work, and personal planning.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="primary-button" href="/login">
                Get started
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700" href="/app">
                Open app
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["AI calendar", "AI notes", "AI reminders", "speech to notes", "speech to calendar", "speech to reminders"].map((keyword) => (
                <span className="mini-chip bg-white" key={keyword}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <div className="grid gap-3">
              {[
                ["AI notes", Brain, "Capture ideas, files, and decisions into searchable memory."],
                ["AI calendar", CalendarClock, "Convert dated context into useful events."],
                ["AI reminders", Bell, "Turn commitments into contextual follow-ups."],
                ["Voice capture", Mic2, "Use speech to create notes, calendar items, and reminders."],
                ["Privacy", Lock, "Sign in with protected user data."],
                ["Files", Database, "Keep uploads tied to your workspace."],
                ["Subscription", CreditCard, "Billing and subscriptions are supported."],
                ["Quebec", ShieldCheck, "Public pages, privacy policy, and terms are also available in French."],
              ].map(([title, Icon, copy]) => (
                <div className="rounded-md border border-zinc-200 bg-white p-4" key={title as string}>
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-zinc-100">
                      <Icon size={17} aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold">{title as string}</h2>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">{copy as string}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <section className="border-t border-zinc-200 py-8 sm:py-10">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">Referral pricing</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">Invite monthly to keep Pro at CA$10.</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600">
                Pro is CA$15/mo by default, with yearly billing available in Stripe Checkout. Referral pricing rewards the inviter after a new contact joins with a single-use code.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {referralRules.map((rule, index) => (
                <div className="rounded-md border border-zinc-200 bg-white p-4" key={rule}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Rule {index + 1}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="border-t border-zinc-200 py-8 sm:py-10">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">FAQ</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">Common questions</h2>
            </div>
            <div className="grid gap-3">
              {faqs.map(([question, answer]) => (
                <details className="rounded-md border border-zinc-200 bg-white p-4" key={question}>
                  <summary className="cursor-pointer text-sm font-semibold">{question}</summary>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 py-5 text-sm text-zinc-500">
          <p>Spaxio Assistant</p>
          <div className="flex flex-wrap gap-4">
            <Link className="hover:text-zinc-950" href="/privacy" hrefLang="en">
              Privacy Policy
            </Link>
            <Link className="hover:text-zinc-950" href="/terms" hrefLang="en">
              Terms and Conditions
            </Link>
            <Link className="hover:text-zinc-950" href="/fr" hrefLang="fr">
              Francais
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
