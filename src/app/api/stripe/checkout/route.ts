import { jsonError, jsonOk } from "@/lib/http";
import { isManageableSubscriptionStatus } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, getStripe } from "@/lib/stripe";
import { hasActiveReferralDiscount } from "@/lib/stripe-referrals";

type BillingInterval = "monthly" | "yearly";

async function getBillingInterval(request: Request): Promise<BillingInterval> {
  try {
    const body = (await request.json()) as { billingInterval?: unknown };
    return body.billingInterval === "yearly" ? "yearly" : "monthly";
  } catch {
    return "monthly";
  }
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_PRO_PRICE_ID) {
    return jsonError("Billing is not configured.", 503);
  }

  const billingInterval = await getBillingInterval(request);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  try {
    const admin = createAdminClient();
    const stripe = getStripe();
    const siteUrl = getSiteUrl();

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, referral_discount_eligible, referral_discount_expires_at")
      .eq("id", user.id)
      .maybeSingle<{
        stripe_customer_id: string | null;
        referral_discount_eligible: boolean | null;
        referral_discount_expires_at: string | null;
      }>();

    let customerId = profile?.stripe_customer_id ?? null;
    const discountEligible = hasActiveReferralDiscount(profile ?? {});

    if (billingInterval === "yearly" && !process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
      return jsonError("Yearly billing is not configured.", 503);
    }

    if (billingInterval === "monthly" && discountEligible && !process.env.STRIPE_PRO_REFERRAL_PRICE_ID) {
      return jsonError("Referral billing is not configured.", 503);
    }

    const priceId =
      billingInterval === "yearly"
        ? process.env.STRIPE_PRO_YEARLY_PRICE_ID!
        : discountEligible
          ? process.env.STRIPE_PRO_REFERRAL_PRICE_ID!
          : process.env.STRIPE_PRO_PRICE_ID;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id,
          referral_discount_eligible: discountEligible ? "true" : "false",
          billing_interval: billingInterval,
        },
      });
      customerId = customer.id;

      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    } else {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 10,
        status: "all",
      });
      const manageableSubscription = subscriptions.data.find((subscription) => isManageableSubscriptionStatus(subscription.status));

      if (manageableSubscription) {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${siteUrl}/app`,
        });

        return jsonOk({ url: portalSession.url });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        referral_discount_eligible: discountEligible ? "true" : "false",
        billing_interval: billingInterval,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          referral_discount_eligible: discountEligible ? "true" : "false",
          billing_interval: billingInterval,
        },
      },
      success_url: `${siteUrl}/app?billing=success`,
      cancel_url: `${siteUrl}/app?billing=cancelled`,
    });

    return jsonOk({ url: session.url });
  } catch {
    return jsonError("Could not start checkout.", 502);
  }
}
