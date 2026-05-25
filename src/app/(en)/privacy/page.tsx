import type { Metadata } from "next";

import LegalPage from "@/components/legal-page";
import { getSiteUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Spaxio Assistant privacy policy for AI notes, AI calendar, AI reminders, voice capture, account data, billing, and Quebec Law 25 transparency.",
  alternates: {
    canonical: "/privacy",
    languages: {
      en: "/privacy",
      fr: "/fr/confidentialite",
      "x-default": "/privacy",
    },
  },
};

const sections = [
  {
    title: "Who is responsible for privacy",
    body:
      "Spaxio Assistant is responsible for personal information handled by the app. The person responsible for the protection of personal information can be reached at privacy@spaxio.app.",
  },
  {
    title: "What we collect",
    items: [
      "Account information, including email address, password authentication data handled by Supabase, profile name, focus area, invite code, and subscription status.",
      "Workspace content you add, including notes, voice transcripts, uploaded files, tasks, reminders, calendar items, shared folder names, collaborators, and notification activity.",
      "AI request content when you use AI capture or search, including the prompt and a limited workspace summary needed to create notes, calendar events, reminders, and answers.",
      "Billing data needed to manage Pro subscriptions, including Stripe customer identifiers, subscription identifiers, payment status, and referral eligibility.",
      "Technical data such as cookies, session identifiers, device/browser metadata, IP-derived security logs, and local browser storage when Supabase is not configured.",
    ],
  },
  {
    title: "Why we use personal information",
    items: [
      "To create and secure accounts, authenticate users, and maintain user sessions.",
      "To save, sync, search, and display notes, files, tasks, calendar items, reminders, shared folders, and workspace settings.",
      "To turn typed or spoken context into AI notes, AI calendar entries, AI reminders, and task suggestions.",
      "To process subscriptions, cancellations, invoices, referrals, and billing support through Stripe.",
      "To send requested account, password, and reminder emails.",
      "To protect the service, investigate errors, prevent abuse, comply with law, and respond to privacy requests.",
    ],
  },
  {
    title: "Voice capture and AI processing",
    body:
      "Voice capture uses the browser speech recognition capability when available. Spaxio Assistant stores the resulting transcript as workspace content only when you submit it. If AI features are configured, prompts and compact workspace context are sent to the AI provider to generate app-ready notes, reminders, calendar events, tasks, and answers. AI output may be inaccurate and should be reviewed before relying on it.",
  },
  {
    title: "Service providers and transfers outside Quebec",
    body:
      "Spaxio Assistant may use service providers including Supabase for authentication, database, storage, and email authentication flows; Stripe for payment and subscription processing; Anthropic for configured AI processing; SMTP/email providers for reminders and account mail; and hosting providers such as Vercel. These providers may process information outside Quebec or Canada. Spaxio Assistant uses these providers only for service delivery, security, support, and compliance purposes.",
  },
  {
    title: "Consent and choices",
    items: [
      "You choose what notes, files, reminders, calendar items, collaborators, and prompts you add to Spaxio Assistant.",
      "You can disable voice-first capture in settings, avoid uploading files, and choose not to use AI prompts.",
      "You can withdraw consent for non-essential uses by changing settings, deleting content, deleting your account, or contacting privacy@spaxio.app.",
      "You should not add information about another person unless you have the right to do so.",
    ],
  },
  {
    title: "Retention and deletion",
    body:
      "Workspace content is kept while your account is active or while local browser storage remains on your device. You can delete your account in the app; this deletes saved workspace data controlled by Spaxio Assistant and cancels active Stripe subscriptions where configured. Some records may be retained for security, fraud prevention, billing, tax, dispute, backup, or legal compliance needs, then deleted or de-identified when no longer required.",
  },
  {
    title: "Security",
    body:
      "Spaxio Assistant uses Supabase row level security, private file storage policies, secure cookies, HTTPS in production, and security headers. No online service can guarantee absolute security. If a confidentiality incident creates a risk of serious injury, Spaxio Assistant will assess the incident, keep required records, and notify affected people and Quebec authorities where required.",
  },
  {
    title: "Your rights",
    items: [
      "You may request access to personal information Spaxio Assistant holds about you.",
      "You may request correction of inaccurate, incomplete, or equivocal personal information.",
      "You may request deletion, withdrawal of consent, or account closure where applicable.",
      "You may ask how automated AI-assisted processing was used for a decision if Spaxio Assistant uses it to make a decision about you.",
      "Spaxio Assistant aims to respond to access and rectification requests in writing within 30 days where Quebec private-sector privacy law applies.",
    ],
  },
  {
    title: "Children",
    body:
      "Spaxio Assistant is not intended for children under 14. Do not create an account or submit personal information for a child under 14 unless a parent or tutor has provided valid consent and the use is lawful.",
  },
  {
    title: "Contact and complaints",
    body:
      "Send privacy requests or complaints to privacy@spaxio.app. Include the email address on your account and enough detail to identify the request. If you are not satisfied with the response, you may contact the Commission d'acces a l'information du Quebec or another applicable privacy authority.",
  },
];

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy",
    url: `${getSiteUrl()}/privacy`,
    inLanguage: "en-CA",
    isPartOf: { "@type": "WebSite", name: "Spaxio Assistant", url: getSiteUrl() },
    description:
      "Spaxio Assistant privacy policy for AI notes, AI calendar, AI reminders, voice capture, account data, billing, and Quebec Law 25 transparency.",
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LegalPage
        eyebrow="Privacy"
        intro="This policy explains how Spaxio Assistant handles personal information for AI notes, speech capture, reminders, calendar planning, billing, and account management."
        languageLinks={[{ href: "/fr/confidentialite", hrefLang: "fr", label: "Francais" }]}
        sections={sections}
        title="Privacy Policy"
        updated="May 21, 2026"
      />
    </>
  );
}
