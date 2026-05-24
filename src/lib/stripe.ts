import Stripe from "stripe";

import { getSiteUrl } from "./url";

let stripe: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
    maxNetworkRetries: 2,
    typescript: true,
  });
  return stripe;
}

export { getSiteUrl };
