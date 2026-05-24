import { jsonError, jsonOk } from "@/lib/http";
import { sendPromotionEmail, type EmailLanguage } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSiteUrl } from "@/lib/url";

export const runtime = "nodejs";

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 200;
const MAX_ATTEMPTS = 3;
const PROCESSING_STALE_MS = 15 * 60 * 1000;

type PromotionDeliveryRow = {
  id: string;
  email: string;
  attempts: number;
  user_id: string;
  unsubscribe_token: string;
  promotion:
    | {
        title: string;
        body: string;
        cta_label: string | null;
        cta_url: string | null;
      }
    | {
        title: string;
        body: string;
        cta_label: string | null;
        cta_url: string | null;
      }[]
    | null;
};

function isAuthorized(request: Request) {
  const secret = process.env.PROMOTION_EMAIL_CRON_SECRET?.trim();
  if (!secret) return false;

  return request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-cron-secret") === secret;
}

function getBatchSize(request: Request) {
  const raw = new URL(request.url).searchParams.get("limit");
  const parsed = Number(raw ?? DEFAULT_BATCH_SIZE);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_BATCH_SIZE;
  return Math.min(Math.floor(parsed), MAX_BATCH_SIZE);
}

function getPromotion(delivery: PromotionDeliveryRow) {
  return Array.isArray(delivery.promotion) ? delivery.promotion[0] : delivery.promotion;
}

function serializeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Could not send promotion email.";
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured.", 500);
  }

  if (!isAuthorized(request)) {
    return jsonError("Unauthorized.", 401);
  }

  const admin = createAdminClient();
  const staleProcessingAt = new Date(Date.now() - PROCESSING_STALE_MS).toISOString();
  const claimFilter = `status.eq.pending,and(status.eq.processing,updated_at.lt.${staleProcessingAt})`;

  const { data: deliveries, error } = await admin
    .from("promotion_email_deliveries")
    .select("id, email, attempts, user_id, unsubscribe_token, promotion:promotions!inner(title, body, cta_label, cta_url)")
    .eq("promotions.active", true)
    .or(claimFilter)
    .order("created_at", { ascending: true })
    .limit(getBatchSize(request))
    .returns<PromotionDeliveryRow[]>();

  if (error) {
    return jsonError(error.message, 500);
  }

  let sent = 0;
  let failed = 0;
  let retried = 0;
  let skipped = 0;

  for (const delivery of deliveries ?? []) {
    const nextAttempts = delivery.attempts + 1;
    const { data: claim } = await admin
      .from("promotion_email_deliveries")
      .update({ attempts: nextAttempts, status: "processing" })
      .eq("id", delivery.id)
      .or(claimFilter)
      .select("id")
      .maybeSingle();

    if (!claim) {
      skipped += 1;
      continue;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("promotion_emails_opt_out, preferred_language")
      .eq("id", delivery.user_id)
      .maybeSingle<{ promotion_emails_opt_out: boolean | null; preferred_language: EmailLanguage | null }>();

    if (profile?.promotion_emails_opt_out !== false) {
      await admin
        .from("promotion_email_deliveries")
        .update({ last_error: "Recipient opted out.", status: "skipped" })
        .eq("id", delivery.id);
      skipped += 1;
      continue;
    }

    const language: EmailLanguage = profile?.preferred_language === "fr" ? "fr" : "en";

    const promotion = getPromotion(delivery);
    if (!promotion) {
      await admin
        .from("promotion_email_deliveries")
        .update({ last_error: "Promotion not found.", status: "failed" })
        .eq("id", delivery.id);
      failed += 1;
      continue;
    }

    try {
      await sendPromotionEmail(
        delivery.email,
        {
          title: promotion.title,
          body: promotion.body,
          ctaLabel: promotion.cta_label,
          ctaUrl: promotion.cta_url,
          unsubscribeUrl: `${getSiteUrl()}/api/promotions/unsubscribe?token=${encodeURIComponent(delivery.unsubscribe_token)}`,
        },
        language,
      );

      await admin
        .from("promotion_email_deliveries")
        .update({ last_error: null, sent_at: new Date().toISOString(), status: "sent" })
        .eq("id", delivery.id);
      sent += 1;
    } catch (sendError) {
      const exhausted = nextAttempts >= MAX_ATTEMPTS;
      await admin
        .from("promotion_email_deliveries")
        .update({
          last_error: serializeError(sendError),
          status: exhausted ? "failed" : "pending",
        })
        .eq("id", delivery.id);

      if (exhausted) failed += 1;
      else retried += 1;
    }
  }

  return jsonOk({ sent, failed, retried, skipped });
}
