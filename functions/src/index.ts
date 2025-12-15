
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

import Stripe from "stripe";

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2024-06-20",
});

export const createStripeCheckout = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { lineItems, eventId, tierId, quantity } = data;

  try {
    // Create a new Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${functions.config().app.url}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${functions.config().app.url}/cancel`,
      metadata: {
        userId: context.auth.uid,
        eventId,
        tierId,
        quantity,
      },
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error("Error creating Stripe Checkout session:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Unable to create a Checkout Session."
    );
  }
});

export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { amount } = data;

  try {
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-06-20' }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "inr",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    };
  } catch (error) {
    console.error("Error creating Payment Intent:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Unable to create Payment Intent."
    );
  }
});
