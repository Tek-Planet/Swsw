
import * as functions from "firebase-functions/v1";
import Stripe from "stripe";
import { admin, db } from "./lib/firebase";

// Import the new matching function
import { processSurveyAndFindMatches } from "./matching";
import { onPhotoCreated, indexUserProfilePicture } from "./face-recognition";
import { generateS3UploadUrl } from "./s3-uploads";

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2023-10-16",
} as any);

//================================================================================
// EXPORT FUNCTIONS
//================================================================================

export { processSurveyAndFindMatches };
export { onPhotoCreated };
export { indexUserProfilePicture };
export { generateS3UploadUrl };

type SelectedTiers = Record<string, number>;

//================================================================================
// HELPER FUNCTIONS
//================================================================================

/**
 * Helper to assert that a value is a positive integer.
 */
function assertPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n > 0;
}

/**
 * [REFACTORED] Calculates order details, totals, and fees based on selected tiers.
 * This logic is now shared between all checkout flows.
 */
async function _calculateOrderDetails(eventId: string, selectedTiers: SelectedTiers) {
  const eventRef = db.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Event not found.");
  }
  const event = eventSnap.data() || {};
  if (event.status && event.status !== "published") {
    throw new functions.https.HttpsError("failed-precondition", "Event is not available.");
  }

  // [NEW] Get dynamic fee and currency, with defaults for safety
  const bookingFeePercent = event.bookingFeePercent ?? 10;
  const currency = event.currency ?? "INR";

  const tierIds = Object.keys(selectedTiers);
  if (tierIds.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "No ticket tiers selected.");
  }
  for (const tierId of tierIds) {
    if (!assertPositiveInt(selectedTiers[tierId])) {
      throw new functions.https.HttpsError("invalid-argument", `Invalid quantity for tier ${tierId}.`);
    }
  }

  const tiersCol = eventRef.collection("ticketTiers");
  const tierSnaps = await Promise.all(tierIds.map((id) => tiersCol.doc(id).get()));

  const itemsForOrder: any[] = [];
  let subtotalCharged = 0;
  let feeBase = 0;

  for (const snap of tierSnaps) {
    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", `Ticket tier not found: ${snap.id}`);
    }
    const tier = snap.data() as any;
    if (tier.isActive !== true) {
      throw new functions.https.HttpsError("failed-precondition", `Ticket tier inactive: ${snap.id}`);
    }

    const qty = selectedTiers[snap.id];
    const type: string = tier.type || "ticket";
    const displayPrice = Number(tier.price);
    const chargeAmount = tier.chargeAmount != null ? Number(tier.chargeAmount) : displayPrice;

    if (!Number.isFinite(displayPrice) || displayPrice < 0) {
      throw new functions.https.HttpsError("failed-precondition", `Invalid price for tier: ${snap.id}`);
    }
    if (!Number.isFinite(chargeAmount) || chargeAmount < 0) {
      throw new functions.https.HttpsError("failed-precondition", `Invalid chargeAmount for tier: ${snap.id}`);
    }

    if (tier.quantityTotal != null) {
      const sold = Number(tier.quantitySold || 0);
      const total = Number(tier.quantityTotal);
      if (sold + qty > total) {
        throw new functions.https.HttpsError("failed-precondition", `Not enough availability for: ${tier.name}`);
      }
    }

    itemsForOrder.push({
      tierId: snap.id,
      name: tier.name,
      type,
      unitPrice: displayPrice,
      chargeAmount,
      quantity: qty,
    });

    const chargedForThisTier = chargeAmount * qty;
    subtotalCharged += chargedForThisTier;

    if (type !== "table") {
      feeBase += chargedForThisTier;
    }
  }

  // [MODIFIED] Calculate processing fee using dynamic percentage
  const processingFee = feeBase > 0 ? Math.round(feeBase * (bookingFeePercent / 100)) : 0;
  const total = subtotalCharged + processingFee;

  return { event, eventRef, itemsForOrder, subtotalCharged, feeBase, processingFee, total, currency, bookingFeePercent };
}

/**
 * [REFACTORED] Marks an order as paid, updates inventory, and grants entitlements.
 * This is used by webhooks, free/VIP checkouts, and direct charges.
 * Operates within a Firestore transaction.
 */
async function _fulfillOrder(
  tx: admin.firestore.Transaction,
  { eventId, eventRef, userId, orderId, items, promoCode }: any
) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const orderRef = db.doc(`orders/${orderId}`);

  // 1. Update order status to paid
  tx.set(orderRef, { status: "paid", updatedAt: now }, { merge: true });

  // 2. Add attendee to the event's subcollection
  tx.update(eventRef, { attendeeIds: admin.firestore.FieldValue.arrayUnion(userId) });

  const tiersCol = db.collection("events").doc(eventId).collection("ticketTiers");

  for (const item of items || []) {
    // 3. Increment sold counts for each ticket tier
    tx.set(
      tiersCol.doc(item.tierId),
      { quantitySold: admin.firestore.FieldValue.increment(item.quantity) },
      { merge: true }
    );

    // 4. Grant entitlement if a photo access addon was purchased
    if (item.type === "addon" && String(item.name).toLowerCase().includes("photo")) {
      tx.set(
        db.doc(`users/${userId}`),
        { hasPhotoAccess: true, updatedAt: now },
        { merge: true }
      );
    }
  }

  // 5. Redeem promo code if one was used
  if (promoCode === "GRIDVIP2207") {
    const promoRef = db.collection("promoCodes").doc("GRIDVIP2207");
    tx.set(
      promoRef,
      { redeemedCount: admin.firestore.FieldValue.increment(1), updatedAt: now },
      { merge: true }
    );
  }
}

/**
 * Validates the GRIDVIP promo code.
 */
async function validateGridVip(eventId: string) {
  const ref = db.collection("promoCodes").doc("GRIDVIP2207");
  const snap = await ref.get();
  if (!snap.exists) return { ok: false as const };
  const data = snap.data() as any;
  if (data.isActive !== true) return { ok: false as const };
  if (data.eventId && data.eventId !== eventId) return { ok: false as const };
  const max = Number(data.maxRedemptions ?? 0);
  const used = Number(data.redeemedCount ?? 0);
  if (max > 0 && used >= max) return { ok: false as const };
  return { ok: true as const };
}


//================================================================================
// PUBLIC CLOUD FUNCTIONS
//================================================================================

/**
 * [NEW] Creates a Payment Intent for use with the mobile app's Payment Sheet.
 */
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }
  const userId = context.auth.uid;

  const { eventId, selectedTiers, promoCode } = data as {
    eventId?: string;
    selectedTiers?: SelectedTiers;
    promoCode?: string;
  };

  if (!eventId || !selectedTiers) {
    throw new functions.https.HttpsError("invalid-argument", "Missing eventId or selectedTiers.");
  }

  // [MODIFIED] Get dynamic currency from the calculation
  const { event, eventRef, itemsForOrder, subtotalCharged, feeBase, processingFee, total, currency, bookingFeePercent } = await _calculateOrderDetails(
    eventId,
    selectedTiers
  );

  // --- Promo Code Logic ---
  const normalizedPromo = (promoCode || "").trim().toUpperCase();
  const isGridVip = normalizedPromo === "GRIDVIP2207";
  let appliedPromo: string | null = null;

  if (isGridVip) {
    const promo = await validateGridVip(eventId);
    if (!promo.ok) {
      throw new functions.https.HttpsError("failed-precondition", "Invalid or expired promo code.");
    }
    appliedPromo = "GRIDVIP2207";
  }

  const shouldBypassStripe = appliedPromo === "GRIDVIP2207" || total === 0;
  const orderId = db.collection("_").doc().id;
  const now = admin.firestore.FieldValue.serverTimestamp();

  // --- Create Order Document ---
  const orderDoc: any = {
    orderId,
    eventId,
    eventTitle: event.title || "Event",
    userId,
    items: itemsForOrder,
    subtotal: subtotalCharged,
    feeBase,
    processingFee: shouldBypassStripe ? 0 : processingFee,
    total: shouldBypassStripe ? 0 : total,
    currency, // [MODIFIED] Use dynamic currency
    promoCode: appliedPromo,
    status: shouldBypassStripe ? "paid" : "pending",
    paymentMethod: "stripe_payment_sheet",
    createdAt: now,
    updatedAt: now,
  };

  // --- Handle Free/VIP Orders ---
  if (shouldBypassStripe) {
    await db.runTransaction(async (tx) => {
      tx.set(db.doc(`orders/${orderId}`), orderDoc);
      await _fulfillOrder(tx, { eventId, eventRef, userId, orderId, items: itemsForOrder, promoCode: appliedPromo });
    });
    return { orderId, free: total === 0, vip: appliedPromo === "GRIDVIP2207" };
  }

  // --- Create Pending Order and Stripe Payment Intent for Paid Orders ---
  await db.doc(`orders/${orderId}`).set(orderDoc);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(orderDoc.total * 100),
    currency, // [MODIFIED] Use dynamic currency
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderId,
      eventId,
      userId,
    },
  });

  if (!paymentIntent.client_secret) {
    throw new functions.https.HttpsError("internal", "Failed to create a Payment Intent.");
  }
  
  await db.doc(`orders/${orderId}`).update({ stripePaymentIntentId: paymentIntent.id });

  return {
    orderId,
    clientSecret: paymentIntent.client_secret,
  };
});

/**
 * [NEW] Updates an order with table contact details. This is callable by EITHER web or mobile.
 */
export const updateOrderContactDetails = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to update an order.");
    }
    const userId = context.auth.uid;
    const { orderId, contactDetails } = data as {
        orderId: string;
        contactDetails: { fullName: string; email: string; phone: string; notes?: string };
    };

    if (!orderId || !contactDetails || !contactDetails.fullName || !contactDetails.email || !contactDetails.phone) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields: orderId and full contact details.");
    }

    const orderRef = db.doc(`orders/${orderId}`);

    try {
        const docSnap = await orderRef.get();
        if (!docSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Order not found.");
        }

        const orderData = docSnap.data();
        if (orderData?.userId !== userId) {
            throw new functions.https.HttpsError("permission-denied", "You do not have permission to update this order.");
        }

        const updatePayload = {
            tableContactDetails: {
                fullName: contactDetails.fullName,
                email: contactDetails.email,
                phone: contactDetails.phone,
                notes: contactDetails.notes || null,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }

        await orderRef.update(updatePayload);

        return { success: true, message: "Contact details updated successfully." };

    } catch (error) {
        console.error("Error updating contact details:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw HttpsError directly
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while processing your request.");
    }
});


export const helloWorld = functions.https.onRequest((_req, res) => {
  res.send("Hello from Tekplanet!");
});

/**
 * [REFACTORED] Creates a Stripe Checkout session for web clients.
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }
  const uid = context.auth.uid;

  const { eventId, selectedTiers, promoCode } = data as { eventId?: string; selectedTiers?: SelectedTiers; promoCode?: string; };
  if (!eventId || !selectedTiers) {
    throw new functions.https.HttpsError("invalid-argument", "Missing eventId or selectedTiers.");
  }

  const { event, eventRef, itemsForOrder, subtotalCharged, feeBase, processingFee, total, currency, bookingFeePercent } = await _calculateOrderDetails(eventId, selectedTiers);

  // Promo handling
  const normalizedPromo = (promoCode || "").trim().toUpperCase();
  const isGridVip = normalizedPromo === "GRIDVIP2207";
  let appliedPromo: string | null = null;
  if (isGridVip) {
    const promo = await validateGridVip(eventId);
    if (!promo.ok) {
      throw new functions.https.HttpsError("failed-precondition", "Invalid or expired promo code.");
    }
    appliedPromo = "GRIDVIP2207";
  }

  const shouldBypassStripe = appliedPromo === "GRIDVIP2207" || total === 0;
  const orderId = db.collection("_").doc().id;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const orderDoc: any = {
    orderId, eventId, eventTitle: event.title || "Event", userId: uid, items: itemsForOrder,
    subtotal: subtotalCharged, feeBase,
    processingFee: shouldBypassStripe ? 0 : processingFee,
    total: shouldBypassStripe ? 0 : total,
    currency,
    promoCode: appliedPromo,
    status: shouldBypassStripe ? "paid" : "pending",
    paymentMethod: "stripe_checkout",
    createdAt: now, updatedAt: now,
  };

  if (shouldBypassStripe) {
    await db.runTransaction(async (tx) => {
      tx.set(db.doc(`orders/${orderId}`), orderDoc);
      await _fulfillOrder(tx, { eventId, eventRef, userId: uid, orderId, items: itemsForOrder, promoCode: appliedPromo });
    });
    return { orderId, vip: appliedPromo === "GRIDVIP2207", free: total === 0 };
  }
  
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = itemsForOrder
    .filter(item => item.chargeAmount > 0)
    .map(item => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: `${event.title} - ${item.name}` },
        unit_amount: Math.round(item.chargeAmount * 100),
      },
      quantity: item.quantity,
    }));

  if (processingFee > 0) {
    line_items.push({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: `Processing fee (${bookingFeePercent}%)` },
        unit_amount: Math.round(processingFee * 100),
      },
      quantity: 1,
    });
  }
  
  await db.doc(`orders/${orderId}`).set(orderDoc);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items,
    success_url: `${functions.config().app.url}/success?orderId=${orderId}`,
    cancel_url: `${functions.config().app.url}/cancel?orderId=${orderId}`,
    metadata: { orderId, eventId, userId: uid },
  });

  if (!session.url) {
    throw new functions.https.HttpsError("internal", "Stripe session URL missing.");
  }

  await db.doc(`orders/${orderId}`).set({ stripeSessionId: session.id, updatedAt: now }, { merge: true });

  return { url: session.url, orderId };
});

/**
 * [CORRECTED] Handles direct Google Pay charges, ensuring consistent data saving.
 */
export const gpayCharge = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }
  const uid = context.auth.uid;
  const { eventId, selectedTiers, promoCode, paymentMethodId } = data;

  if (!eventId || !selectedTiers || !paymentMethodId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields: eventId, selectedTiers, paymentMethodId.");
  }
  
  const { event, eventRef, itemsForOrder, subtotalCharged, feeBase, processingFee, total, currency, bookingFeePercent } = await _calculateOrderDetails(eventId, selectedTiers);
  const orderId = db.collection("_").doc().id; 
  
  if (total === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Free orders should use the standard checkout flow, not Google Pay.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), 
      currency: currency.toLowerCase(),
      payment_method_data: {
        type: 'card',
        card: {
          token: paymentMethodId, 
        },
      } as any,
      confirm: true, 
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: { orderId, eventId, userId: uid },
    });

    if (paymentIntent.status === "succeeded") {
      await db.runTransaction(async (tx) => {
        const now = admin.firestore.FieldValue.serverTimestamp();
        const orderDoc = {
            orderId, eventId, eventTitle: event.title || "Event", userId: uid, items: itemsForOrder,
            subtotal: subtotalCharged,
            feeBase: feeBase,
            processingFee: processingFee,
            total, currency, promoCode, status: "paid",
            paymentMethod: "gpay_direct",
            stripePaymentIntentId: paymentIntent.id,
            createdAt: now, updatedAt: now,
        };
        tx.set(db.doc(`orders/${orderId}`), orderDoc);
        await _fulfillOrder(tx, { eventId, eventRef, userId: uid, orderId, items: itemsForOrder, promoCode });
      });
      return { success: true, orderId };
    } else {
      throw new functions.https.HttpsError("internal", "Payment failed with status: " + paymentIntent.status);
    }
  } catch (error: any) {
      console.error("Google Pay charge failed:", error);
      const stripeErrorMessage = error.raw ? error.raw.message : "An internal error occurred during payment.";
      throw new functions.https.HttpsError("internal", stripeErrorMessage, { orderId });
  }
});


/**
 * [REFACTORED] Handles Stripe webhooks for session completion.
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).send("Missing Stripe signature");
    return;
  }

  try {
    const evt = stripe.webhooks.constructEvent((req as any).rawBody, sig, functions.config().stripe.webhook_secret);

    if (evt.type === "checkout.session.completed") {
      const session = evt.data.object as Stripe.Checkout.Session;
      const { orderId, eventId, userId } = session.metadata || {};

      if (!orderId || !eventId || !userId) {
        console.warn("Webhook ignored: Missing metadata in session", session.id);
        res.status(200).send("Ignoring event with missing metadata.");
        return;
      }

      const orderSnap = await db.doc(`orders/${orderId}`).get();
      const eventRef = db.doc(`events/${eventId}`);
      if (!orderSnap.exists) {
        console.error("Webhook failed: Order not found", orderId);
        res.status(404).send("Order not found");
        return;
      }
      const order = orderSnap.data() as any;
      
      await db.runTransaction(async (tx) => {
        await _fulfillOrder(tx, {
          eventId,
          eventRef,
          userId,
          orderId,
          items: order.items,
          promoCode: order.promoCode,
        });
      });
    }

    res.status(200).send("ok");
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

/**
 * Allows an admin user to set custom claims on another user.
 */
export const setAdminStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can perform this action.");
  }
  const { uid, isAdmin } = data;
  if (typeof uid !== "string" || typeof isAdmin !== "boolean") {
    throw new functions.https.HttpsError("invalid-argument", "Required: 'uid' (string) and 'isAdmin' (boolean).");
  }
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
    return { message: `Success! User ${uid} has been ${isAdmin ? "made" : "removed as"} an admin.` };
  } catch (error) {
    console.error("Failed to set custom claims:", error);
    throw new functions.https.HttpsError("internal", "An error occurred while setting the custom claim.");
  }
});

/**
 * Temporary admin setup function.
 */
export const tempSetAdmins = functions.https.onRequest(async (_req, res) => {
  const uids = [''];
  try {
    await Promise.all(uids.map(uid => admin.auth().setCustomUserClaims(uid, { admin: true })));
    res.send("Admins set!");
  } catch (error) {
    console.error("Failed to set admins:", error);
    res.status(500).send("Error setting admins");
  }
});
