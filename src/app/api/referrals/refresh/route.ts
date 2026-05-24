import { jsonError, jsonOk } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyStandardPriceToSubscription } from "@/lib/stripe-referrals";

export const dynamic = "force-dynamic";

type ExpiredReferralProfile = {
  id: string;
  stripe_subscription_id: string | null;
};

export async function POST(request: Request) {
  const expectedSecret = process.env.REFERRAL_REFRESH_CRON_SECRET;

  if (!expectedSecret) {
    return jsonError("Referral refresh is not configured.", 503);
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${expectedSecret}`) {
    return jsonError("Unauthorized.", 401);
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: expiredProfiles, error } = await admin
    .from("profiles")
    .select("id, stripe_subscription_id")
    .eq("referral_discount_eligible", true)
    .not("referral_discount_expires_at", "is", null)
    .lte("referral_discount_expires_at", now)
    .returns<ExpiredReferralProfile[]>();

  if (error) {
    return jsonError("Could not load expired referrals.", 500);
  }

  const profiles = expiredProfiles ?? [];
  for (const profile of profiles) {
    if (profile.stripe_subscription_id) {
      try {
        await applyStandardPriceToSubscription(profile.stripe_subscription_id);
      } catch {
        // Keep processing other accounts; the profile flag is still cleared below.
      }
    }
  }

  if (profiles.length) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        referral_discount_eligible: false,
        updated_at: now,
      })
      .in(
        "id",
        profiles.map((profile) => profile.id),
      );

    if (updateError) {
      return jsonError("Could not update expired referrals.", 500);
    }
  }

  return jsonOk({ refreshed: profiles.length });
}
