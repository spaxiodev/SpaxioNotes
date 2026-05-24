import { isAdminUser } from "@/lib/admin";
import { jsonError, jsonOk } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PromotionRequest = {
  title?: unknown;
  body?: unknown;
  ctaLabel?: unknown;
  ctaUrl?: unknown;
  active?: unknown;
};

type PromotionRecipientRow = {
  id: string;
  email: string | null;
  promotion_email_token: string | null;
};

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function optionalUrl(value: unknown) {
  const cleaned = cleanString(value, 500);
  if (!cleaned) return null;
  try {
    const url = new URL(cleaned);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured.", 500);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  if (!isAdminUser(user.id)) {
    return jsonError("Forbidden.", 403);
  }

  let payload: PromotionRequest;
  try {
    payload = (await request.json()) as PromotionRequest;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const title = cleanString(payload.title, 180);
  const body = cleanString(payload.body, 4000);
  const ctaLabel = cleanString(payload.ctaLabel, 60) || null;
  const ctaUrl = optionalUrl(payload.ctaUrl);
  const active = payload.active === undefined ? true : Boolean(payload.active);

  if (!title || !body) {
    return jsonError("Promotion title and body are required.", 400);
  }

  const admin = createAdminClient();
  const { data: promotion, error } = await admin
    .from("promotions")
    .insert({
      title,
      body,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      active,
      created_by: user.id,
    })
    .select("id, title, body, cta_label, cta_url, active, created_at")
    .single();

  if (error || !promotion) {
    return jsonError(error?.message || "Could not create promotion.", 500);
  }

  if (active) {
    const { data: recipients } = await admin
      .from("profiles")
      .select("id, email, promotion_email_token")
      .eq("promotion_emails_opt_out", false)
      .not("email", "is", null)
      .returns<PromotionRecipientRow[]>();

    const deliveries = (recipients ?? [])
      .map((row) => ({
        promotion_id: promotion.id,
        user_id: row.id,
        email: typeof row.email === "string" ? row.email.trim() : "",
        unsubscribe_token: row.promotion_email_token ?? "",
      }))
      .filter((delivery) => delivery.email.length > 0 && delivery.unsubscribe_token.length > 0);

    if (deliveries.length > 0) {
      const { error: queueError } = await admin.from("promotion_email_deliveries").upsert(deliveries, {
        ignoreDuplicates: true,
        onConflict: "promotion_id,user_id",
      });

      if (queueError) {
        return jsonError(queueError.message, 500);
      }
    }

    return jsonOk({ promotion, queued: deliveries.length }, 201);
  }

  return jsonOk({ promotion, queued: 0 }, 201);
}
