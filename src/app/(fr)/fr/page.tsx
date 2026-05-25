import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Bell, Brain, CalendarClock, CreditCard, Database, Lock, Mic2, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { getSiteUrl } from "@/lib/url";

export const metadata: Metadata = {
  alternates: {
    canonical: "/fr",
    languages: {
      en: "/",
      fr: "/fr",
      "x-default": "/",
    },
  },
};

export default function FrenchLandingPage() {
  const siteUrl = `${getSiteUrl()}/fr`;
  const referralRules = [
    "Chaque code d'invitation peut etre utilise par une seule nouvelle personne.",
    "Quand votre contact s'inscrit, votre code est marque comme utilise et un nouveau lien d'invitation est genere.",
    "Vous obtenez Pro a 10 $ CA/mois pour le premier mois de reference, puis vous conservez ce prix en invitant une nouvelle personne chaque mois.",
    "Les contacts commencent a 15 $ CA/mois jusqu'a ce qu'ils invitent quelqu'un avec leur propre lien.",
  ];
  const faqs = [
    [
      "Comment fonctionne le rabais d'invitation?",
      "Votre lien d'invitation vous donne le prix de reference de 10 $ CA/mois apres l'inscription d'une nouvelle personne. Cette personne commence au prix Pro standard de 15 $ CA/mois.",
    ],
    [
      "Un code d'invitation peut-il etre utilise plus d'une fois?",
      "Non. Chaque code d'invitation est a usage unique. Apres son utilisation, votre compte recoit un nouveau lien d'invitation.",
    ],
    [
      "Comment conserver le prix mensuel de 10 $ CA?",
      "Invitez une nouvelle personne chaque mois. Si aucune nouvelle personne ne s'inscrit pendant le mois de reference, le prix Pro standard de 15 $ CA/mois s'applique.",
    ],
    [
      "Que comprend Pro?",
      "Pro debloque les fonctions de capture IA axees sur la voix et l'acces par abonnement gere avec Stripe.",
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
      "Espace de travail IA pour notes vocales, calendrier, rappels, planification de taches et memoire consultable.",
    offers: [
      {
        "@type": "Offer",
        name: "Spaxio Assistant gratuit",
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
          <Link className="flex items-center gap-3" href="/fr">
            <BrandLogo className="border border-zinc-200" />
            <div>
              <p className="text-base font-semibold leading-none sm:text-lg">Spaxio Assistant</p>
              <p className="mt-1 text-xs text-zinc-500">Espace de travail IA</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-950 md:inline" href="/fr/confidentialite">
              Confidentialite
            </Link>
            <Link className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-950 md:inline" href="/fr/conditions">
              Conditions
            </Link>
            <div aria-label="Changer de langue" className="flex h-9 items-center rounded-md border border-zinc-200 bg-white p-1 sm:h-10">
              <span className="inline-flex h-7 items-center justify-center rounded-sm bg-zinc-950 px-2.5 text-xs font-medium text-white sm:h-8 sm:px-3 sm:text-sm">
                FR
              </span>
              <Link
                className="inline-flex h-7 items-center justify-center rounded-sm px-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 sm:h-8 sm:px-3 sm:text-sm"
                href="/"
                hrefLang="en"
              >
                EN
              </Link>
            </div>
            <Link className="primary-button" href="/fr/login">
              Connexion
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_460px]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">Espace de travail IA</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-5xl lg:text-6xl xl:text-7xl">
              Notes IA, calendrier et rappels a partir de votre contexte quotidien.
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8 lg:text-xl">
              Spaxio Assistant transforme vos notes ecrites et votre voix en memoire consultable, taches, evenements de calendrier et
              rappels pour les etudes, le travail client et la planification personnelle.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="primary-button" href="/fr/login">
                Commencer
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700" href="/app">
                Ouvrir l&apos;app
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["calendrier IA", "notes IA", "rappels IA", "parole vers notes", "parole vers calendrier", "parole vers rappels"].map((keyword) => (
                <span className="mini-chip bg-white" key={keyword}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <div className="grid gap-3">
              {[
                ["Notes IA", Brain, "Capturez idees, fichiers et decisions dans une memoire consultable."],
                ["Calendrier IA", CalendarClock, "Convertissez le contexte date en evenements utiles."],
                ["Rappels IA", Bell, "Transformez les engagements en suivis contextuels."],
                ["Capture vocale", Mic2, "Utilisez la parole pour creer notes, calendrier et rappels."],
                ["Confidentialite", Lock, "Connectez-vous avec des donnees utilisateur protegees."],
                ["Fichiers", Database, "Gardez les televersements lies a votre espace de travail."],
                ["Abonnement", CreditCard, "La facturation et les abonnements sont pris en charge."],
                ["Quebec", ShieldCheck, "Interface publique, confidentialite et conditions disponibles en francais."],
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
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">Prix de reference</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">Invitez chaque mois pour garder Pro a 10 $ CA.</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600">
                Pro est a 15 $ CA/mois par defaut, avec facturation annuelle disponible dans Stripe Checkout. Le prix de reference
                recompense la personne qui invite apres l&apos;inscription d&apos;un nouveau contact avec un code a usage unique.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {referralRules.map((rule, index) => (
                <div className="rounded-md border border-zinc-200 bg-white p-4" key={rule}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Regle {index + 1}</p>
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
              <h2 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">Questions frequentes</h2>
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
            <Link className="hover:text-zinc-950" href="/fr/confidentialite" hrefLang="fr">
              Politique de confidentialite
            </Link>
            <Link className="hover:text-zinc-950" href="/fr/conditions" hrefLang="fr">
              Conditions d&apos;utilisation
            </Link>
            <Link className="hover:text-zinc-950" href="/" hrefLang="en">
              English
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
