import type { Metadata } from "next";

import LegalPage from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Spaxio Assistant terms for AI notes, AI calendar, AI reminders, speech capture, subscriptions, cancellation, acceptable use, and Quebec consumer rights.",
  alternates: {
    canonical: "/terms",
    languages: {
      fr: "/fr/conditions",
    },
  },
};

const sections = [
  {
    title: "Agreement",
    body:
      "These Terms and Conditions govern your access to Spaxio Assistant, a web app for notes, tasks, reminders, calendar planning, shared folders, file capture, speech capture, and AI-assisted workspace features. By creating an account, using the app, or buying a subscription, you agree to these terms.",
  },
  {
    title: "Service provider and contact",
    body:
      "Spaxio Assistant is provided by the operator of the Spaxio Assistant application. Legal, privacy, and support requests can be sent to privacy@spaxio.app.",
  },
  {
    title: "Accounts",
    items: [
      "You must provide accurate account information and keep your credentials secure.",
      "You are responsible for activity under your account and for the content you add to Spaxio Assistant.",
      "You may not share access in a way that compromises another user's privacy or the security of the service.",
      "Spaxio Assistant may suspend or close accounts that abuse the service, create security risk, or violate these terms.",
    ],
  },
  {
    title: "Plans, price, and payment",
    items: [
      "Spaxio Assistant offers a Free plan and a Pro subscription. The standard Pro monthly price shown in the app is CA$15 per month, and a yearly Pro option may be available, unless Stripe Checkout shows a different current price.",
      "Invite-eligible accounts may be offered Pro at CA$10 per month for a referral month while that promotion is available and configured.",
      "Prices are shown in Canadian dollars unless Stripe Checkout states otherwise. Applicable taxes, if any, are displayed or collected through Stripe.",
      "Payments, invoices, payment methods, renewals, and failed payment handling are processed by Stripe.",
    ],
  },
  {
    title: "Referral discount rules",
    items: [
      "Each invite code can be used by one new account. After a successful signup, that code is considered used and the inviter receives a new invite link.",
      "When a friend joins with your invite link, your account becomes eligible for the CA$10 Pro price for the first referral month. To keep the CA$10 monthly price, you must invite one new friend each month.",
      "The friend who joins does not receive the CA$10 price from using your invite. They start at the standard CA$15 Pro price unless they invite someone with their own link.",
      "Referral eligibility may be delayed or unavailable if payment, email, fraud prevention, or Stripe configuration fails. Spaxio Assistant may correct referral eligibility if an invite is abused or used in error.",
    ],
  },
  {
    title: "Subscription renewal and cancellation",
    body:
      "Pro subscriptions renew monthly or yearly, depending on the billing interval selected at checkout, until cancelled. You can manage or cancel a Pro subscription from the app billing screen through the Stripe billing portal. Cancellation stops future renewal but does not automatically refund prior paid periods unless required by law or expressly stated in Stripe or Spaxio Assistant billing terms. Your statutory consumer rights, including rights that may apply to Quebec distance contracts, are not limited by these terms.",
  },
  {
    title: "AI and speech features",
    items: [
      "AI capture can turn typed or spoken context into notes, tasks, calendar items, reminders, summaries, and answers.",
      "Speech capture depends on browser speech recognition and may not work in every browser or language.",
      "AI and speech output can be incomplete, inaccurate, or inappropriate for your situation. Review output before relying on it.",
      "Spaxio Assistant is a productivity tool and does not provide legal, medical, financial, academic, or professional advice.",
    ],
  },
  {
    title: "Your content",
    body:
      "You keep ownership of notes, prompts, files, reminders, calendar items, and other content you add. You grant Spaxio Assistant the limited rights needed to host, process, display, back up, transmit, and analyze that content to provide the service, including AI-assisted features you choose to use.",
  },
  {
    title: "Acceptable use",
    items: [
      "Do not upload unlawful content, malware, credentials you do not have permission to store, or content that infringes another person's rights.",
      "Do not use Spaxio Assistant to harass people, send spam, perform surveillance, or make automated decisions that unlawfully affect others.",
      "Do not attempt to bypass authentication, rate limits, payment controls, storage controls, or security protections.",
      "Do not reverse engineer the service except where applicable law gives you a non-waivable right to do so.",
    ],
  },
  {
    title: "Availability and changes",
    body:
      "Spaxio Assistant may change, add, or remove features, including AI providers, browser speech support, storage limits, plan features, and billing flows. Spaxio Assistant may interrupt the service for maintenance, security, provider outages, or events outside reasonable control. For open-ended consumer service contracts where Quebec law applies, material term changes will be handled in the manner required by applicable law.",
  },
  {
    title: "Privacy",
    body:
      "Use of Spaxio Assistant is also governed by the Privacy Policy. The Privacy Policy explains account data, workspace content, AI prompts, billing data, service providers, retention, security, and Quebec privacy rights.",
  },
  {
    title: "Account deletion",
    body:
      "You can request or trigger account deletion from the app where available. Account deletion removes saved workspace data controlled by Spaxio Assistant and cancels active Stripe subscriptions where configured. Some billing, tax, security, dispute, backup, and legal records may be kept as required or permitted by law.",
  },
  {
    title: "Limits of liability",
    body:
      "To the maximum extent allowed by applicable law, Spaxio Assistant is provided as is and as available. Spaxio Assistant is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, or loss of goodwill. Nothing in these terms excludes liability or legal warranties that cannot be excluded under Quebec or other applicable consumer protection law.",
  },
  {
    title: "Governing law",
    body:
      "These terms are governed by the laws of Quebec and the federal laws of Canada that apply there, without limiting any mandatory consumer protection rights available in your place of residence.",
  },
  {
    title: "French language",
    body:
      "A French version of these terms is available at /fr/conditions. If you are a Quebec consumer, you may communicate with Spaxio Assistant in French. The operator should obtain legal review before launch to confirm the French version and ordering flow satisfy all Quebec language and consumer contract requirements.",
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      intro="These terms set the rules for using Spaxio Assistant, including account access, subscriptions, AI features, speech capture, calendar and reminder tools, and content responsibilities."
      languageLinks={[{ href: "/fr/conditions", hrefLang: "fr", label: "Francais" }]}
      sections={sections}
      title="Terms and Conditions"
      updated="May 21, 2026"
    />
  );
}
