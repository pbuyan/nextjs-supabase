"use server";

import { createClient } from "@/utils/supabase/server";
import stripe from "@/utils/stripe";

interface CheckoutSessionResponse {
  url?: string;
  error?: string;
}

export async function createCheckoutSession(): Promise<CheckoutSessionResponse> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not logged in");
  }

  try {
    let { data: existingTransaction, error } = await supabase
      .from("transactions")
      .select("*");

    if (existingTransaction) {
      // retrieve the customer subscription from stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: existingTransaction[0].customerId as string,
        status: "all",
        limit: 1,
      });

      // check if any subscription is active
      const currentSubscription = subscriptions.data.find(
        (sub) => sub.status === "active"
      );

      if (currentSubscription) {
        return { error: "You already have an active subscription" };
      }
    }

    if (existingTransaction) {
      // create a new checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: process.env.STRIPE_MONTHLY_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer_email: existingTransaction[0].customerEmail as string,
        success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}`,
      });

      return { url: session.url ?? undefined };
    }
    return { error: "No active subscriptions" };
  } catch (err) {
    console.error(err);
    return { error: "Error creating stripe checkout session" };
  }
}

export async function checkUserSusbcription() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not logged in");
  }

  try {
    let { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "complete");

    if (transactions && transactions[0].subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        transactions[0].subscriptionId
      );

      if (subscription.status === "active") {
        return {
          ok: true,
        };
      } else {
        return {
          ok: false,
        };
      }
    }
  } catch (err) {
    console.error(err);
    return { message: "Error checking subscription" };
  }
}

export async function createCustomerPortalSession() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not logged in");
  }

  try {
    let { data: transactions, error } = await supabase
      .from("transactions")
      .select("*");

    if (transactions && transactions[0].customerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: transactions[0].customerId,
        return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
      });

      console.log("portal session => ", portalSession);

      return portalSession.url ?? `${process.env.NEXT_PUBLIC_URL}/dashboard`;
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
}
