import { getStripe } from "./stripe";

async function updateSubscriptionPrice(subscriptionId: string, priceId: string, referralEligible: boolean) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return;
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const item = subscription.items.data[0];

  if (!item || item.price.id === priceId) {
    return;
  }

  if (item.price.recurring?.interval === "year") {
    return;
  }

  await stripe.subscriptions.update(subscription.id, {
    items: [
      {
        id: item.id,
        price: priceId,
      },
    ],
    metadata: {
      ...subscription.metadata,
      referral_discount_eligible: referralEligible ? "true" : "false",
    },
    proration_behavior: "none",
  });
}

export async function applyReferralPriceToSubscription(subscriptionId: string) {
  const referralPriceId = process.env.STRIPE_PRO_REFERRAL_PRICE_ID;

  if (!referralPriceId) {
    return;
  }

  await updateSubscriptionPrice(subscriptionId, referralPriceId, true);
}

export async function applyStandardPriceToSubscription(subscriptionId: string) {
  const standardPriceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!standardPriceId) {
    return;
  }

  await updateSubscriptionPrice(subscriptionId, standardPriceId, false);
}

export function hasActiveReferralDiscount(profile: { referral_discount_eligible?: boolean | null; referral_discount_expires_at?: string | null }) {
  return (
    profile.referral_discount_eligible === true &&
    (!profile.referral_discount_expires_at || new Date(profile.referral_discount_expires_at).getTime() > Date.now())
  );
}
