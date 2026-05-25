"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendInviteSignupEmail, sendReferralDiscountEmail, type EmailLanguage } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { applyReferralPriceToSubscription } from "@/lib/stripe-referrals";
import { getRequestOrigin, sanitizeRedirectPath } from "@/lib/url";

type Locale = "en" | "fr";

const LOGIN_PATH: Record<Locale, string> = {
  en: "/login",
  fr: "/fr/login",
};

const RESET_PATH: Record<Locale, string> = {
  en: "/reset-password",
  fr: "/fr/reset-password",
};

const MESSAGES = {
  en: {
    legalRequired: "You must accept the terms and privacy policy to create an account.",
    inviteInvalid: "This invite link is not valid.",
    signupFailed: "Could not create the account.",
    loginFailed: "Could not sign you in.",
    inviteUsed: "This invite code was already used. Ask for the latest invite link.",
    confirmEmail: "Check your email to confirm your account.",
    inviteSuccess: "Invite code applied. Check your email to confirm your account.",
    resetRequiresSmtp: "Password reset requires email configuration.",
    enterEmailFirst: "Enter your email first.",
    resetSendFailed: "Could not send the reset link.",
    resetSent: "Check your email for the reset link.",
    passwordMismatch: "Passwords must match and be at least 8 characters.",
    passwordUpdateFailed: "Could not update the password.",
    passwordUpdated: "Password updated. Sign in with your new password.",
    nameRequired: "Enter your full name to create an account.",
    signupPasswordMismatch: "Passwords must match and be at least 8 characters.",
  },
  fr: {
    legalRequired:
      "Vous devez accepter les conditions et la politique de confidentialite pour creer un compte.",
    inviteInvalid: "Ce lien d'invitation est invalide.",
    signupFailed: "Creation du compte impossible.",
    loginFailed: "Connexion impossible.",
    inviteUsed: "Ce code d'invitation a deja ete utilise. Demandez le plus recent lien d'invitation.",
    confirmEmail: "Verifiez votre courriel pour confirmer votre compte.",
    inviteSuccess:
      "Code d'invitation utilise avec succes. Verifiez votre courriel pour confirmer votre compte.",
    resetRequiresSmtp: "La reinitialisation du mot de passe requiert la configuration du courriel.",
    enterEmailFirst: "Entrez d'abord votre courriel.",
    resetSendFailed: "Envoi du lien de reinitialisation impossible.",
    resetSent: "Verifiez votre courriel pour le lien de reinitialisation.",
    passwordMismatch: "Les mots de passe doivent correspondre et avoir au moins 8 caracteres.",
    passwordUpdateFailed: "Mise a jour du mot de passe impossible.",
    passwordUpdated: "Mot de passe mis a jour. Connectez-vous avec votre nouveau mot de passe.",
    nameRequired: "Entrez votre nom complet pour creer un compte.",
    signupPasswordMismatch:
      "Les mots de passe doivent correspondre et avoir au moins 8 caracteres.",
  },
} as const;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getLocale(formData: FormData): Locale {
  return getString(formData, "locale") === "fr" ? "fr" : "en";
}

function normalizeInviteCode(value: string) {
  const code = value.trim().toLowerCase();
  return /^[a-z0-9_-]{4,64}$/.test(code) ? code : "";
}

function createInviteCode() {
  return randomBytes(8).toString("hex");
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function redirectToLogin(locale: Locale, message: string, inviteCode?: string): never {
  const params = new URLSearchParams({ message });
  if (inviteCode) params.set("invite", inviteCode);
  redirect(`${LOGIN_PATH[locale]}?${params.toString()}`);
}

function redirectToReset(locale: Locale, message: string): never {
  const params = new URLSearchParams({ message });
  redirect(`${RESET_PATH[locale]}?${params.toString()}`);
}

export async function login(formData: FormData) {
  const locale = getLocale(formData);
  const messages = MESSAGES[locale];

  if (!hasSupabaseEnv()) {
    redirect("/app");
  }

  const supabase = await createClient();
  const next = sanitizeRedirectPath(getString(formData, "next"), "/app");
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectToLogin(locale, messages.loginFailed);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const locale = getLocale(formData);
  const messages = MESSAGES[locale];

  if (!hasSupabaseEnv()) {
    redirect("/app");
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");
  const fullName = getString(formData, "fullName").trim();
  const inviteCode = normalizeInviteCode(getString(formData, "invite"));
  const legalAccepted = getString(formData, "legalAccepted") === "yes";

  if (!legalAccepted) {
    redirectToLogin(locale, messages.legalRequired, inviteCode);
  }

  if (!fullName) {
    redirectToLogin(locale, messages.nameRequired, inviteCode);
  }

  if (password.length < 8 || password !== confirmPassword) {
    redirectToLogin(locale, messages.signupPasswordMismatch, inviteCode);
  }

  let inviterId: string | null = null;
  let inviterSubscriptionId: string | null = null;
  let inviterSubscriptionStatus: string | null = null;
  let inviterEmail: string | null = null;
  let inviterLanguage: EmailLanguage = "en";

  if (inviteCode) {
    const admin = createAdminClient();
    const { data: inviter } = await admin
      .from("profiles")
      .select("id, email, stripe_subscription_id, subscription_status, preferred_language")
      .eq("invite_code", inviteCode)
      .maybeSingle<{
        id: string;
        email: string | null;
        stripe_subscription_id: string | null;
        subscription_status: string | null;
        preferred_language: EmailLanguage | null;
      }>();

    if (!inviter) {
      redirectToLogin(locale, messages.inviteInvalid, inviteCode);
    }

    inviterId = inviter.id;
    inviterEmail = inviter.email;
    inviterSubscriptionId = inviter.stripe_subscription_id;
    inviterSubscriptionStatus = inviter.subscription_status;
    if (inviter.preferred_language === "fr") inviterLanguage = "fr";
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        ...(inviteCode ? { invite_code: inviteCode } : {}),
      },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    redirectToLogin(locale, messages.signupFailed, inviteCode);
  }

  if (data.user) {
    const admin = createAdminClient();

    await admin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", data.user.id);

    if (inviterId && inviterId !== data.user.id) {
      const activatedAtDate = new Date();
      const activatedAt = activatedAtDate.toISOString();
      const discountExpiresAt = addMonths(activatedAtDate, 1).toISOString();
      const nextInviteCode = createInviteCode();

      const { data: activatedInviter } = await admin
        .from("profiles")
        .update({
          invite_code: nextInviteCode,
          referral_discount_eligible: true,
          referral_discount_activated_at: activatedAt,
          referral_discount_expires_at: discountExpiresAt,
        })
        .eq("id", inviterId)
        .eq("invite_code", inviteCode)
        .select("id")
        .maybeSingle<{ id: string }>();

      if (!activatedInviter) {
        redirectToLogin(locale, messages.inviteUsed);
      }

      await admin.from("profiles").upsert(
        {
          id: data.user.id,
          email,
          full_name: fullName,
          referred_by_user_id: inviterId,
          referral_discount_eligible: false,
        },
        { onConflict: "id" },
      );

      if (inviterSubscriptionId && ["active", "trialing"].includes(inviterSubscriptionStatus ?? "")) {
        try {
          await applyReferralPriceToSubscription(inviterSubscriptionId);
        } catch {
          // The referral remains recorded even if the existing Stripe subscription needs a manual retry.
        }
      }

      if (inviterEmail) {
        try {
          await sendInviteSignupEmail(
            inviterEmail,
            { referredEmail: email, referredName: fullName },
            inviterLanguage,
          );
        } catch {
          // The invite remains successful even if SMTP is unavailable.
        }

        try {
          await sendReferralDiscountEmail(
            inviterEmail,
            {
              referredEmail: email,
              discountExpiresAt,
            },
            inviterLanguage,
          );
        } catch {
          // The invite remains successful even if SMTP is unavailable.
        }
      }
    }
  }

  redirectToLogin(locale, inviteCode ? messages.inviteSuccess : messages.confirmEmail);
}

export async function resetPassword(formData: FormData) {
  const locale = getLocale(formData);
  const messages = MESSAGES[locale];

  if (!hasSupabaseEnv()) {
    redirectToLogin(locale, messages.resetRequiresSmtp);
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const email = getString(formData, "email");

  if (!email) {
    redirectToLogin(locale, messages.enterEmailFirst);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(RESET_PATH[locale])}`,
  });

  if (error) {
    redirectToLogin(locale, messages.resetSendFailed);
  }

  redirectToLogin(locale, messages.resetSent);
}

export async function updatePassword(formData: FormData) {
  const locale = getLocale(formData);
  const messages = MESSAGES[locale];

  if (!hasSupabaseEnv()) {
    redirectToLogin(locale, messages.resetRequiresSmtp);
  }

  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (password.length < 8 || password !== confirmPassword) {
    redirectToReset(locale, messages.passwordMismatch);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectToReset(locale, messages.passwordUpdateFailed);
  }

  revalidatePath("/", "layout");
  redirectToLogin(locale, messages.passwordUpdated);
}

export async function logout() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
