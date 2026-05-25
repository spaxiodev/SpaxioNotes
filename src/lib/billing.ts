export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
export const MANAGEABLE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "unpaid"] as const;

export function isActiveSubscriptionStatus(status: string | null | undefined) {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]);
}

export function isManageableSubscriptionStatus(status: string | null | undefined) {
  return MANAGEABLE_SUBSCRIPTION_STATUSES.includes(status as (typeof MANAGEABLE_SUBSCRIPTION_STATUSES)[number]);
}

export function hasProEntitlement(profile: { plan?: string | null; subscription_status?: string | null } | null | undefined) {
  return profile?.plan === "pro" && isActiveSubscriptionStatus(profile.subscription_status);
}
