import { jsonError, jsonOk } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

type ProfileBillingRow = {
  stripe_customer_id: string | null;
};

export async function DELETE() {
  if (!hasSupabaseEnv()) return jsonError("Account deletion is not configured.", 503);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Unauthorized.", 401);

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle<ProfileBillingRow>();

    if (profile?.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      const stripe = getStripe();
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        limit: 20,
        status: "all",
      });

      await Promise.all(
        subscriptions.data
          .filter((subscription) => ["active", "trialing", "past_due", "unpaid"].includes(subscription.status))
          .map((subscription) => stripe.subscriptions.cancel(subscription.id)),
      );
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return jsonError("Could not delete account.", 500);

    return jsonOk({ deleted: true });
  } catch {
    return jsonError("Could not delete account.", 500);
  }
}
