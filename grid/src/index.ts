import * as functions from "firebase-functions/v1";

import { processSurveyAndFindMatches } from "./matching";
import {
  indexUserProfilePicture,
  adminRunEventFaceRecognition,
} from "./face-recognition";
import {
  generateS3UploadUrl,
  adminGenerateBatchS3UploadUrls,
} from "./s3-uploads";
import {
  createPaymentIntent,
  updateOrderContactDetails,
  createCheckoutSession,
  gpayCharge,
  stripeWebhook,
} from "./payments";
import { setAdminStatus } from "./admin";
import { sendEventPushNotification } from "./notifications";

export {
  processSurveyAndFindMatches,
  indexUserProfilePicture,
  adminRunEventFaceRecognition,
  generateS3UploadUrl,
  adminGenerateBatchS3UploadUrls,
  createPaymentIntent,
  updateOrderContactDetails,
  createCheckoutSession,
  gpayCharge,
  stripeWebhook,
  setAdminStatus,
  sendEventPushNotification,
};

export const helloWorld = functions.https.onRequest((_req, res) => {
  res.send("Hello from Tekplanet!");
});

/**
 * [REFACTORED] Creates a Stripe Checkout session for web clients.
 */
export const createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    const { eventId, selectedTiers, promoCode, attendees } = data;

    if (!eventId || !selectedTiers) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields"
      );
    }

    const userId = context.auth?.uid;
    if (!userId) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be logged in"
      );
    }

    // Get event details
    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Event not found");
    }
    const eventData = eventDoc.data()!;
    const eventTitle = eventData.title || "Event";
    const currency = (eventData.currency || "INR").toUpperCase();
    const feePercent = eventData.bookingFeePercent ?? 10;

    // Get ticket tiers
    const tiersSnapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("ticketTiers")
      .get();

    const tiers: Record<string, any> = {};
    tiersSnapshot.forEach((doc) => {
      tiers[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Calculate totals
    let subtotal = 0;
    let feeBase = 0;
    const items: any[] = [];

    for (const [tierId, qty] of Object.entries(selectedTiers)) {
      const quantity = typeof qty === "number" ? qty : (qty as any).quantity;
      if (!quantity || quantity <= 0) continue;

      const tier = tiers[tierId];
      if (!tier) {
        throw new functions.https.HttpsError(
          "not-found",
          `Tier ${tierId} not found`
        );
      }

      const chargeAmount =
        tier.type === "table" && tier.chargeAmount !== undefined
          ? tier.chargeAmount
          : tier.price;

      subtotal += chargeAmount * quantity;

      // Only tickets and addons contribute to fee base
      if (tier.type !== "table") {
        feeBase += chargeAmount * quantity;
      }

      items.push({
        tierId,
        tierName: tier.name,
        tierType: tier.type || "ticket",
        price: tier.price,
        chargeAmount,
        quantity,
      });
    }

    const processingFee = Math.round(feeBase * (feePercent / 100));
    const total = subtotal + processingFee;
    // Validate promo code
    let discountAmount = 0;
    let promoCodeId: string | null = null;
    let validatedPromoCode: string | null = null;

    if (promoCode) {
      const upperCode = promoCode.trim().toUpperCase();

      const promoData = await validatePromoCode(eventId, upperCode);
      if (promoData && promoData.discountType) {
        discountAmount = calculateDiscount(
          promoData.discountType,
          promoData.discountValue,
          total
        );
        promoCodeId = promoData.promoId;
        validatedPromoCode = upperCode;
      }
    }

    const finalTotal = Math.max(0, total - discountAmount);

    // Create order document first
    const orderRef = db.collection("orders").doc();
    const orderData: Record<string, any> = {
      userId,
      eventId,
      eventTitle,
      items,
      attendees, // NEW: store attendees
      subtotal,
      feeBase,
      processingFee,
      total: finalTotal,
      currency,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: "stripe_checkout",
    };

    // Add discount info if applicable
    if (discountAmount > 0) {
      orderData.discount = discountAmount;
      orderData.promoCode = validatedPromoCode;
      if (promoCodeId) {
        orderData.promoCodeId = promoCodeId;
      }
    }

    // Handle free orders (after discount)
    if (finalTotal === 0) {
      orderData.status = "paid";
      orderData.paidAt = admin.firestore.FieldValue.serverTimestamp();

      await db.runTransaction(async (tx) => {
        tx.set(orderRef, orderData);
        await _fulfillOrder(tx, {
          eventId,
          eventRef: db.doc(`events/${eventId}`),
          userId,
          orderId: orderRef.id,
          items,
          promoCodeId,
          attendees,
        });
      });

      return { orderId: orderRef.id, free: true };
    }

    // Save pending order
    await orderRef.set(orderData);

    // Build Stripe line items
    const line_items: any[] = [];

    for (const item of items) {
      line_items.push({
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(item.chargeAmount * 100),
          product_data: {
            name: item.tierName,
            description: `${eventTitle} - ${item.tierType}`,
          },
        },
        quantity: item.quantity,
      });
    }

    // Add processing fee line item
    if (processingFee > 0) {
      line_items.push({
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(processingFee * 100),
          product_data: {
            name: "Processing Fee",
            description: "Booking and processing fee",
          },
        },
        quantity: 1,
      });
    }

    // Create Stripe coupon for discount (if applicable)
    let discountCoupon: string | undefined;
    if (discountAmount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: currency.toLowerCase(),
        duration: "once",
        name: `Promo: ${validatedPromoCode}`,
      });
      discountCoupon = coupon.id;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${functions.config().app.url}/success?orderId=${
        orderRef.id
      }`,
      cancel_url: `${functions.config().app.url}/cancel?orderId=${orderRef.id}`,
      metadata: {
        orderId: orderRef.id,
        userId: userId,
        eventId: eventId,
      },
      ...(discountCoupon && { discounts: [{ coupon: discountCoupon }] }),
    });

    return { url: session.url, orderId: orderRef.id };
  }
);

/**
 * [CORRECTED] Handles direct Google Pay charges with promo code support.
 */
export const gpayCharge = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in."
    );
  }
  const uid = context.auth.uid;
  const { eventId, selectedTiers, promoCode, paymentMethodId, attendees } =
    data;

  if (!eventId || !selectedTiers || !paymentMethodId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: eventId, selectedTiers, paymentMethodId."
    );
  }

  const {
    event,
    eventRef,
    itemsForOrder,
    subtotalCharged,
    feeBase,
    processingFee,
    total,
    currency,
  } = await _calculateOrderDetails(eventId, selectedTiers);

  // --- Promo Code Logic ---
  const normalizedPromo = (promoCode || "").trim().toUpperCase();
  let appliedPromo: string | null = null;
  let promoCodeId: string | null = null;
  let discountAmount = 0;

  if (normalizedPromo) {
    const promo = await validatePromoCode(eventId, normalizedPromo);
    if (!promo.ok) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Invalid or expired promo code."
      );
    }
    appliedPromo = normalizedPromo;
    promoCodeId = promo.promoId;
    discountAmount = calculateDiscount(
      promo.discountType,
      promo.discountValue,
      total
    );
  }

  const finalTotal = Math.max(0, total - discountAmount);
  const orderId = db.collection("_").doc().id;

  // If discount makes the order free, bypass Stripe
  if (finalTotal === 0) {
    await db.runTransaction(async (tx) => {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const orderDoc = {
        orderId,
        eventId,
        eventTitle: event.title || "Event",
        userId: uid,
        items: itemsForOrder,
        attendees, // NEW: store attendees
        subtotal: subtotalCharged,
        feeBase,
        processingFee: 0,
        total: 0,
        discount: discountAmount,
        currency,
        promoCode: appliedPromo,
        promoCodeId,
        status: "paid",
        paymentMethod: "gpay_direct",
        createdAt: now,
        updatedAt: now,
      };
      tx.set(db.doc(`orders/${orderId}`), orderDoc);
      await _fulfillOrder(tx, {
        eventId,
        eventRef,
        userId: uid,
        orderId,
        items: itemsForOrder,
        promoCodeId,
        attendees,
      });
    });
    return { success: true, orderId, free: true };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalTotal * 100),
      currency: currency.toLowerCase(),
      payment_method_data: {
        type: "card",
        card: { token: paymentMethodId },
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
          orderId,
          eventId,
          eventTitle: event.title || "Event",
          userId: uid,
          items: itemsForOrder,
          attendees, // NEW: store attendees
          subtotal: subtotalCharged,
          feeBase,
          processingFee,
          total: finalTotal,
          discount: discountAmount,
          currency,
          promoCode: appliedPromo,
          promoCodeId,
          status: "paid",
          paymentMethod: "gpay_direct",
          stripePaymentIntentId: paymentIntent.id,
          createdAt: now,
          updatedAt: now,
        };
        tx.set(db.doc(`orders/${orderId}`), orderDoc);
        await _fulfillOrder(tx, {
          eventId,
          eventRef,
          userId: uid,
          orderId,
          items: itemsForOrder,
          promoCodeId,
          attendees,
        });
      });
      return { success: true, orderId };
    } else {
      throw new functions.https.HttpsError(
        "internal",
        "Payment failed with status: " + paymentIntent.status
      );
    }
  } catch (error: any) {
    console.error("Google Pay charge failed:", error);
    const stripeErrorMessage = error.raw
      ? error.raw.message
      : "An internal error occurred during payment.";
    throw new functions.https.HttpsError("internal", stripeErrorMessage, {
      orderId,
    });
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
    const evt = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig,
      functions.config().stripe.webhook_secret
    );

    if (evt.type === "checkout.session.completed") {
      const session = evt.data.object as Stripe.Checkout.Session;
      const { orderId, eventId, userId } = session.metadata || {};

      if (!orderId || !eventId || !userId) {
        console.warn(
          "Webhook ignored: Missing metadata in session",
          session.id
        );
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
          promoCodeId: order.promoCodeId,
          attendees: order.attendees,
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
// Firebase Cloud Function - setAdminStatus (modified)

export const setAdminStatus = functions.https.onCall(async (data, context) => {
  // Only existing admins can perform this action
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can perform this action."
    );
  }

  const { uid, role, isActive, eventIds } = data;

  // Validate required fields
  if (typeof uid !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Required: 'uid' (string)."
    );
  }

  if (!["admin", "event_admin"].includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Role must be 'admin' or 'event_admin'."
    );
  }

  if (typeof isActive !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Required: 'isActive' (boolean)."
    );
  }

  // For event_admin, eventIds is required when activating
  if (role === "event_admin" && isActive) {
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Event admin requires 'eventIds' array with at least one event."
      );
    }
  }

  try {
    // Get current claims to preserve other claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    let newClaims = { ...currentClaims };

    if (role === "admin") {
      // Set full admin status
      if (isActive) {
        newClaims.admin = true;
      } else {
        delete newClaims.admin;
      }
    } else if (role === "event_admin") {
      // Set event admin status with specific events
      if (isActive) {
        newClaims.eventAdmin = true;
        newClaims.eventIds = eventIds;
      } else {
        delete newClaims.eventAdmin;
        delete newClaims.eventIds;
      }
    }

    await admin.auth().setCustomUserClaims(uid, newClaims);

    // Also update Firestore user_roles collection for consistency
    const db = admin.firestore();
    const userRoleRef = db.collection("user_roles").doc(uid);

    if (isActive) {
      await userRoleRef.set(
        {
          userId: uid,
          role: role,
          eventIds: role === "event_admin" ? eventIds : [],
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // Remove the role document if deactivating
      await userRoleRef.delete().catch(() => {}); // Ignore if doesn't exist
    }

    return {
      message: `Success! User ${uid} ${
        isActive ? "granted" : "removed"
      } ${role} access.`,
      claims: newClaims,
    };
  } catch (error) {
    console.error("Failed to set custom claims:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while setting the custom claim."
    );
  }
});
