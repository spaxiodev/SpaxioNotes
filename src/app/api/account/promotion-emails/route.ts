import { jsonError, jsonOk } from "@/lib/http";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PromotionEmailPreferenceRequest = {
  optOut?: unknown;
};

export async function PATCH(request: Request) {
  if (!hasSupabaseEnv()) {
    return jsonError("Supabase is not configured.", 500);
  }

  let payload: PromotionEmailPreferenceRequest;
  try {
    payload = (await request.json()) as PromotionEmailPreferenceRequest;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  if (typeof payload.optOut !== "boolean") {
    return jsonError("Promotion email preference is required.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      promotion_emails_opt_out: payload.optOut,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk({ promotionEmailsOptOut: payload.optOut });
}
