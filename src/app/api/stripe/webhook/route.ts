import { headers } from "next/headers";
import Stripe from "stripe";

import { jsonError, jsonOk } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { applyReferralPriceToSubscription, applyStandardPriceToSubscription, hasActiveReferralDiscount } from "@/lib/stripe-referrals";

export const dynamic = "force-dynamic";

async function updateSubscription(customerId: string, subscription: Stripe.Subscription | null) {
  const admin = createAdminClient();
  const plan = subscription && ["active", "trialing"].includes(subscription.status) ? "pro" : "free";

  const { data: profile } = await admin
    .from("profiles")
    .select("id, referral_discount_eligible, referral_discount_expires_at")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<{ id: string; referral_discount_eligible: boolean | null; referral_discount_expires_at: string | null }>();

  const referralDiscountActive = hasActiveReferralDiscount(profile ?? {});

  await admin
    .from("profiles")
    .update({
      plan,
      subscription_status: subscription?.status ?? "inactive",
      stripe_subscription_id: subscription?.id ?? null,
      referral_discount_eligible: referralDiscountActive,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (subscription && ["active", "trialing"].includes(subscription.status)) {
    if (referralDiscountActive) {
      await applyReferralPriceToSubscription(subscription.id);
    } else {
      await applyStandardPriceToSubscription(subscription.id);
    }
  }
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return jsonError("Webhook is not configured.", 503);
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return jsonError("Missing Stripe signature.", 400);
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return jsonError("Invalid webhook signature.", 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (customerId && subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          await updateSubscription(customerId, subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        await updateSubscription(customerId, subscription);
        break;
      }
      default:
        break;
    }
  } catch {
    return jsonError("Could not process webhook.", 500);
  }

  return jsonOk({ received: true });
}
