import * as functions from "firebase-functions";
import Stripe from "stripe";

const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: "2024-06-20",
});

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to make a purchase.");
  }

  const { eventId, selectedTiers } = data;

  if (!eventId || !selectedTiers) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required data.");
  }

  // In a real app, you would fetch the event and ticket details from Firestore
  // to verify the prices and availability.

  const line_items = Object.keys(selectedTiers).map(tierId => {
    // This is a simplified example. You would fetch the tier details from Firestore.
    const tierDetails = { name: "Ticket", price: 5000 }; // Placeholder
    return {
      price_data: {
        currency: "inr",
        product_data: {
          name: tierDetails.name,
        },
        unit_amount: tierDetails.price * 100, // Stripe expects the amount in cents
      },
      quantity: selectedTiers[tierId],
    };
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${functions.config().app.url}/PurchaseConfirmationScreen?orderId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${functions.config().app.url}/TicketSelectionScreen?eventId=${eventId}`,
      metadata: {
        userId: context.auth.uid,
        eventId,
      },
    });

    return { id: session.id };
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    throw new functions.https.HttpsError("internal", "Could not create checkout session.");
  }
});
