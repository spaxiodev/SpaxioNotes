import nodemailer from "nodemailer";

import type { Reminder } from "@/components/spaxio-app";
import { getSiteUrl } from "@/lib/url";

export type EmailLanguage = "en" | "fr";

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

function getSmtpConfig(): SmtpConfig {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user;

  if (!user || !pass || !from) {
    throw new Error("SMTP is not configured.");
  }

  const port = Number(process.env.SMTP_PORT || "465");

  return {
    host: process.env.SMTP_HOST?.trim() || "mail.privateemail.com",
    port: Number.isFinite(port) ? port : 465,
    secure: (process.env.SMTP_SECURE ?? "true") !== "false",
    user,
    pass,
    from,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const reminderCopy = {
  en: {
    subject: (title: string) => `Reminder: ${title}`,
    triggerLabel: "Trigger",
    openApp: "Open Spaxio Assistant",
  },
  fr: {
    subject: (title: string) => `Rappel : ${title}`,
    triggerLabel: "Declencheur",
    openApp: "Ouvrir Spaxio Assistant",
  },
} as const;

function reminderText(reminder: Reminder, language: EmailLanguage) {
  const copy = reminderCopy[language];
  return [
    reminder.title,
    "",
    `${copy.triggerLabel}: ${reminder.trigger}`,
    "",
    reminder.context,
    "",
    `${copy.openApp}: ${getSiteUrl()}/app`,
  ].join("\n");
}

function reminderHtml(reminder: Reminder, language: EmailLanguage) {
  const copy = reminderCopy[language];
  return [
    "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#18181b\">",
    `<h1 style=\"font-size:20px;margin:0 0 16px\">${escapeHtml(reminder.title)}</h1>`,
    `<p style=\"margin:0 0 12px\"><strong>${copy.triggerLabel}:</strong> ${escapeHtml(reminder.trigger)}</p>`,
    `<p style=\"margin:0 0 20px\">${escapeHtml(reminder.context)}</p>`,
    `<p style=\"margin:0\"><a href=\"${escapeHtml(`${getSiteUrl()}/app`)}\">${copy.openApp}</a></p>`,
    "</div>",
  ].join("");
}

export async function sendReminderEmail(to: string, reminder: Reminder, language: EmailLanguage = "en") {
  const smtp = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: reminderCopy[language].subject(reminder.title),
    text: reminderText(reminder, language),
    html: reminderHtml(reminder, language),
  });
}

export type PromotionEmail = {
  title: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  unsubscribeUrl?: string | null;
};

const promotionCopy = {
  en: {
    fallbackCta: "Learn more",
    openApp: "Open Spaxio Assistant",
    unsubscribe: "Unsubscribe from promotion emails",
  },
  fr: {
    fallbackCta: "En savoir plus",
    openApp: "Ouvrir Spaxio Assistant",
    unsubscribe: "Se desabonner des courriels promotionnels",
  },
} as const;

function promotionText(promotion: PromotionEmail, language: EmailLanguage) {
  const copy = promotionCopy[language];
  const lines = [promotion.title, "", promotion.body, "", `${copy.openApp}: ${getSiteUrl()}/app`];
  if (promotion.ctaUrl) lines.splice(4, 0, `${promotion.ctaLabel || copy.fallbackCta}: ${promotion.ctaUrl}`, "");
  if (promotion.unsubscribeUrl) lines.push("", `${copy.unsubscribe}: ${promotion.unsubscribeUrl}`);
  return lines.join("\n");
}

function promotionHtml(promotion: PromotionEmail, language: EmailLanguage) {
  const copy = promotionCopy[language];
  const safeBody = escapeHtml(promotion.body).replaceAll("\n", "<br />");
  const ctaBlock = promotion.ctaUrl
    ? `<p style="margin:0 0 20px"><a href="${escapeHtml(promotion.ctaUrl)}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#18181b;color:#ffffff;text-decoration:none">${escapeHtml(promotion.ctaLabel || copy.fallbackCta)}</a></p>`
    : "";
  return [
    "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#18181b\">",
    `<h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(promotion.title)}</h1>`,
    `<p style="margin:0 0 20px">${safeBody}</p>`,
    ctaBlock,
    `<p style="margin:0;color:#71717a;font-size:13px"><a href="${escapeHtml(`${getSiteUrl()}/app`)}" style="color:#71717a">${copy.openApp}</a></p>`,
    promotion.unsubscribeUrl
      ? `<p style="margin:16px 0 0;color:#71717a;font-size:12px"><a href="${escapeHtml(promotion.unsubscribeUrl)}" style="color:#71717a">${copy.unsubscribe}</a></p>`
      : "",
    "</div>",
  ].join("");
}

export async function sendPromotionEmail(to: string, promotion: PromotionEmail, language: EmailLanguage = "en") {
  const smtp = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: promotion.title,
    text: promotionText(promotion, language),
    html: promotionHtml(promotion, language),
  });
}

export type ReferralDiscountEmail = {
  referredEmail: string;
  discountExpiresAt: string;
};

const referralCopy = {
  en: {
    subject: "Your Spaxio invite code was used",
    headline: "Your invite code was used successfully.",
    paragraph1: (email: string) => `${email} joined Spaxio Assistant with your invite link.`,
    paragraph2: "Your Pro subscription is eligible for the CA$10 first-month referral price. To keep the CA$10 monthly price, invite one new friend each month.",
    paragraph3: "Friends start at the standard CA$15/month price until they invite someone too.",
    expiresLabel: "Current referral month ends",
    nextInviteCta: "Send your next invite",
    dateLocale: "en-CA",
  },
  fr: {
    subject: "Votre code d'invitation Spaxio a ete utilise",
    headline: "Votre code d'invitation a ete utilise avec succes.",
    paragraph1: (email: string) => `${email} s'est inscrit a Spaxio Assistant avec votre lien d'invitation.`,
    paragraph2: "Votre abonnement Pro est admissible au prix de reference de 10 $ CA pour le premier mois. Pour conserver le prix mensuel de 10 $ CA, invitez une nouvelle personne chaque mois.",
    paragraph3: "Vos contacts commencent au prix standard de 15 $ CA par mois jusqu'a ce qu'ils invitent quelqu'un eux aussi.",
    expiresLabel: "Le mois de reference en cours se termine",
    nextInviteCta: "Envoyer votre prochaine invitation",
    dateLocale: "fr-CA",
  },
} as const;

function formatReferralDate(value: string, language: EmailLanguage) {
  return new Date(value).toLocaleDateString(referralCopy[language].dateLocale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function referralDiscountText(details: ReferralDiscountEmail, language: EmailLanguage) {
  const copy = referralCopy[language];
  return [
    copy.headline,
    "",
    copy.paragraph1(details.referredEmail),
    "",
    `${copy.paragraph2} ${copy.paragraph3}`,
    "",
    `${copy.expiresLabel}: ${formatReferralDate(details.discountExpiresAt, language)}`,
    "",
    `${copy.nextInviteCta}: ${getSiteUrl()}/app`,
  ].join("\n");
}

function referralDiscountHtml(details: ReferralDiscountEmail, language: EmailLanguage) {
  const copy = referralCopy[language];
  return [
    "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#18181b\">",
    `<h1 style=\"font-size:20px;margin:0 0 16px\">${escapeHtml(copy.headline)}</h1>`,
    `<p style=\"margin:0 0 12px\">${escapeHtml(copy.paragraph1(details.referredEmail))}</p>`,
    `<p style=\"margin:0 0 12px\">${escapeHtml(copy.paragraph2)}</p>`,
    `<p style=\"margin:0 0 20px\">${escapeHtml(copy.paragraph3)}</p>`,
    `<p style=\"margin:0 0 20px\"><strong>${escapeHtml(copy.expiresLabel)} :</strong> ${escapeHtml(formatReferralDate(details.discountExpiresAt, language))}</p>`,
    `<p style=\"margin:0\"><a href=\"${escapeHtml(`${getSiteUrl()}/app`)}\">${copy.nextInviteCta}</a></p>`,
    "</div>",
  ].join("");
}

export async function sendReferralDiscountEmail(to: string, details: ReferralDiscountEmail, language: EmailLanguage = "en") {
  const smtp = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: referralCopy[language].subject,
    text: referralDiscountText(details, language),
    html: referralDiscountHtml(details, language),
  });
}

export type InviteSignupEmail = {
  referredEmail: string;
  referredName: string | null;
};

const inviteSignupCopy = {
  en: {
    subject: (who: string) => `${who} just signed up with your Spaxio invite`,
    headline: (who: string) => `${who} just signed up.`,
    paragraph: (name: string | null, email: string) =>
      name
        ? `${name} (${email}) created a Spaxio Assistant account using your invite link.`
        : `${email} created a Spaxio Assistant account using your invite link.`,
    openCta: "Open Spaxio Assistant",
  },
  fr: {
    subject: (who: string) => `${who} vient de s'inscrire avec votre invitation Spaxio`,
    headline: (who: string) => `${who} vient de s'inscrire.`,
    paragraph: (name: string | null, email: string) =>
      name
        ? `${name} (${email}) a cree un compte Spaxio Assistant a partir de votre lien d'invitation.`
        : `${email} a cree un compte Spaxio Assistant a partir de votre lien d'invitation.`,
    openCta: "Ouvrir Spaxio Assistant",
  },
} as const;

function inviteSignupDisplayName(details: InviteSignupEmail) {
  return details.referredName?.trim() || details.referredEmail;
}

function inviteSignupText(details: InviteSignupEmail, language: EmailLanguage) {
  const copy = inviteSignupCopy[language];
  const who = inviteSignupDisplayName(details);
  return [
    copy.headline(who),
    "",
    copy.paragraph(details.referredName, details.referredEmail),
    "",
    `${copy.openCta}: ${getSiteUrl()}/app`,
  ].join("\n");
}

function inviteSignupHtml(details: InviteSignupEmail, language: EmailLanguage) {
  const copy = inviteSignupCopy[language];
  const who = inviteSignupDisplayName(details);
  return [
    "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#18181b\">",
    `<h1 style=\"font-size:20px;margin:0 0 16px\">${escapeHtml(copy.headline(who))}</h1>`,
    `<p style=\"margin:0 0 20px\">${escapeHtml(copy.paragraph(details.referredName, details.referredEmail))}</p>`,
    `<p style=\"margin:0\"><a href=\"${escapeHtml(`${getSiteUrl()}/app`)}\">${copy.openCta}</a></p>`,
    "</div>",
  ].join("");
}

export async function sendInviteSignupEmail(to: string, details: InviteSignupEmail, language: EmailLanguage = "en") {
  const smtp = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: inviteSignupCopy[language].subject(inviteSignupDisplayName(details)),
    text: inviteSignupText(details, language),
    html: inviteSignupHtml(details, language),
  });
}
