import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

export function formatAmountForStripe(amount: number): number {
  return Math.round(amount);
}

export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}
