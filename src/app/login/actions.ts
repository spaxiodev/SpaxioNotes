"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendReferralDiscountEmail, type EmailLanguage } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { applyReferralPriceToSubscription } from "@/lib/stripe-referrals";
import { getRequestOrigin, sanitizeRedirectPath } from "@/lib/url";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
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

function loginRedirectWithMessage(message: string, inviteCode?: string): never {
  const params = new URLSearchParams({ message });
  if (inviteCode) params.set("invite", inviteCode);
  redirect(`/login?${params.toString()}`);
}

export async function login(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/app");
  }

  const supabase = await createClient();
  const next = sanitizeRedirectPath(getString(formData, "next"), "/app");
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?message=Connexion%20impossible.");
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/app");
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const inviteCode = normalizeInviteCode(getString(formData, "invite"));
  const legalAccepted = getString(formData, "legalAccepted") === "yes";

  if (!legalAccepted) {
    loginRedirectWithMessage("Vous devez accepter les conditions et la politique de confidentialite pour creer un compte.", inviteCode);
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
      .maybeSingle<{ id: string; email: string | null; stripe_subscription_id: string | null; subscription_status: string | null; preferred_language: EmailLanguage | null }>();

    if (!inviter) {
      loginRedirectWithMessage("Ce lien d'invitation est invalide.", inviteCode);
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
      data: inviteCode ? { invite_code: inviteCode } : undefined,
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    loginRedirectWithMessage("Creation du compte impossible.", inviteCode);
  }

  if (data.user && inviterId && inviterId !== data.user.id) {
    const admin = createAdminClient();
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
      loginRedirectWithMessage("Ce code d'invitation a deja ete utilise. Demandez le plus recent lien d'invitation.");
    }

    await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        full_name: email.split("@")[0],
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

  redirect(
    inviteCode
      ? "/login?message=Code%20d'invitation%20utilise%20avec%20succes.%20Verifiez%20votre%20courriel%20pour%20confirmer%20votre%20compte."
      : "/login?message=Verifiez%20votre%20courriel%20pour%20confirmer%20votre%20compte.",
  );
}

export async function resetPassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/login?message=La%20reinitialisation%20du%20mot%20de%20passe%20requiert%20la%20configuration%20du%20courriel.");
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const email = getString(formData, "email");

  if (!email) {
    redirect("/login?message=Entrez%20d'abord%20votre%20courriel.");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    redirect("/login?message=Envoi%20du%20lien%20de%20reinitialisation%20impossible.");
  }

  redirect("/login?message=Verifiez%20votre%20courriel%20pour%20le%20lien%20de%20reinitialisation.");
}

export async function updatePassword(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/login?message=La%20reinitialisation%20du%20mot%20de%20passe%20requiert%20la%20configuration%20du%20courriel.");
  }

  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (password.length < 8 || password !== confirmPassword) {
    redirect("/reset-password?message=Les%20mots%20de%20passe%20doivent%20correspondre%20et%20avoir%20au%20moins%208%20caracteres.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/reset-password?message=Mise%20a%20jour%20du%20mot%20de%20passe%20impossible.");
  }

  revalidatePath("/", "layout");
  redirect("/login?message=Mot%20de%20passe%20mis%20a%20jour.%20Connectez-vous%20avec%20votre%20nouveau%20mot%20de%20passe.");
}

export async function logout() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
