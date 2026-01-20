import * as functions from "firebase-functions/v1";
import Stripe from "stripe";
import { admin, db } from "./lib/firebase";

// Import the new matching function
import { processSurveyAndFindMatches } from "./matching";
import {
  indexUserProfilePicture,
  adminRunEventFaceRecognition,
} from "./face-recognition";
import {
  generateS3UploadUrl,
  adminGenerateBatchS3UploadUrls,
} from "./s3-uploads";

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2023-10-16",
} as any);

//================================================================================
// EXPORT FUNCTIONS
//================================================================================

export { processSurveyAndFindMatches };
export { indexUserProfilePicture };
export { generateS3UploadUrl };
export { adminRunEventFaceRecognition };
export { adminGenerateBatchS3UploadUrls };

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
 * Validates a promo code from Firestore (non-GRIDVIP codes).
 */
async function validatePromoCode(eventId: string, code: string) {
  const promoQuery = db
    .collection("promoCodes")
    .where("eventId", "==", eventId)
    .where("code", "==", code);

  const snapshot = await promoQuery.get();

  if (snapshot.empty) {
    return { ok: false as const, reason: "not_found" };
  }

  const promoDoc = snapshot.docs[0];
  const promoData = promoDoc.data();

  if (!promoData.isActive) {
    return { ok: false as const, reason: "inactive" };
  }

  const maxRedemptions = promoData.maxRedemptions ?? 0;
  const currentRedemptions = promoData.currentRedemptions ?? 0;

  if (maxRedemptions > 0 && currentRedemptions >= maxRedemptions) {
    return { ok: false as const, reason: "max_reached" };
  }

  return {
    ok: true as const,
    promoId: promoDoc.id,
    discountType: promoData.discountType as "percent" | "fixed" | "free",
    discountValue: promoData.discountValue ?? 0,
  };
}

/**
 * Calculates the discount amount based on promo type.
 */
function calculateDiscount(
  discountType: "percent" | "fixed" | "free",
  discountValue: number,
  total: number
): number {
  switch (discountType) {
    case "free":
      return total;
    case "percent":
      return Math.round((total * discountValue) / 100);
    case "fixed":
      return Math.min(discountValue, total);
    default:
      return 0;
  }
}

/**
 * Increments the redemption count for a promo code.
 */
async function incrementPromoRedemption(
  tx: admin.firestore.Transaction,
  promoId: string
) {
  const promoRef = db.collection("promoCodes").doc(promoId);
  tx.update(promoRef, {
    currentRedemptions: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * [REFACTORED] Calculates order details, totals, and fees based on selected tiers.
 * This logic is now shared between all checkout flows.
 */
async function _calculateOrderDetails(
  eventId: string,
  selectedTiers: SelectedTiers
) {
  const eventRef = db.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Event not found.");
  }
  const event = eventSnap.data() || {};
  if (event.status && event.status !== "published") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Event is not available."
    );
  }

  // Get dynamic fee and currency, with defaults for safety
  const bookingFeePercent = event.bookingFeePercent ?? 10;
  const currency = event.currency ?? "INR";

  const tierIds = Object.keys(selectedTiers);
  if (tierIds.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No ticket tiers selected."
    );
  }
  for (const tierId of tierIds) {
    if (!assertPositiveInt(selectedTiers[tierId])) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid quantity for tier ${tierId}.`
      );
    }
  }

  const tiersCol = eventRef.collection("ticketTiers");
  const tierSnaps = await Promise.all(
    tierIds.map((id) => tiersCol.doc(id).get())
  );

  const itemsForOrder: any[] = [];
  let subtotalCharged = 0;
  let feeBase = 0;

  for (const snap of tierSnaps) {
    if (!snap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `Ticket tier not found: ${snap.id}`
      );
    }
    const tier = snap.data() as any;
    if (tier.isActive !== true) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Ticket tier inactive: ${snap.id}`
      );
    }

    const qty = selectedTiers[snap.id];
    const type: string = tier.type || "ticket";
    const displayPrice = Number(tier.price);
    const chargeAmount =
      tier.chargeAmount != null ? Number(tier.chargeAmount) : displayPrice;

    if (!Number.isFinite(displayPrice) || displayPrice < 0) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Invalid price for tier: ${snap.id}`
      );
    }
    if (!Number.isFinite(chargeAmount) || chargeAmount < 0) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Invalid chargeAmount for tier: ${snap.id}`
      );
    }

    if (tier.quantityTotal != null) {
      const sold = Number(tier.quantitySold || 0);
      const total = Number(tier.quantityTotal);
      if (sold + qty > total) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          `Not enough availability for: ${tier.name}`
        );
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

  // Calculate processing fee using dynamic percentage
  const processingFee =
    feeBase > 0 ? Math.round(feeBase * (bookingFeePercent / 100)) : 0;
  const total = subtotalCharged + processingFee;

  return {
    event,
    eventRef,
    itemsForOrder,
    subtotalCharged,
    feeBase,
    processingFee,
    total,
    currency,
    bookingFeePercent,
  };
}

/**
 * [REFACTORED] Marks an order as paid, updates inventory, and grants entitlements.
 * This is used by webhooks, free/VIP checkouts, and direct charges.
 * Operates within a Firestore transaction.
 */
async function _fulfillOrder(
  tx: admin.firestore.Transaction,
  { eventId, eventRef, userId, orderId, items, promoCode, promoCodeId }: any
) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const orderRef = db.doc(`orders/${orderId}`);

  // 1. Update order status to paid
  tx.set(orderRef, { status: "paid", updatedAt: now }, { merge: true });

  // 2. Add attendee to the event's subcollection
  tx.update(eventRef, {
    attendeeIds: admin.firestore.FieldValue.arrayUnion(userId),
  });

  const tiersCol = db
    .collection("events")
    .doc(eventId)
    .collection("ticketTiers");

  for (const item of items || []) {
    // 3. Increment sold counts for each ticket tier
    tx.set(
      tiersCol.doc(item.tierId),
      { quantitySold: admin.firestore.FieldValue.increment(item.quantity) },
      { merge: true }
    );

    // 4. Grant entitlement if a photo access addon was purchased
    if (
      item.type === "addon" &&
      String(item.name).toLowerCase().includes("photo")
    ) {
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
      {
        redeemedCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      },
      { merge: true }
    );
  } else if (promoCodeId) {
    // Increment redemption for non-GRIDVIP codes
    await incrementPromoRedemption(tx, promoCodeId);
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
 * Creates a Payment Intent for use with the mobile app's Payment Sheet.
 */
export const createPaymentIntent = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in."
      );
    }
    const userId = context.auth.uid;

    const { eventId, selectedTiers, promoCode } = data as {
      eventId?: string;
      selectedTiers?: SelectedTiers;
      promoCode?: string;
    };

    if (!eventId || !selectedTiers) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing eventId or selectedTiers."
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
    const isGridVip = normalizedPromo === "GRIDVIP2207";
    let appliedPromo: string | null = null;
    let promoCodeId: string | null = null;
    let discountAmount = 0;

    if (isGridVip) {
      const promo = await validateGridVip(eventId);
      if (!promo.ok) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Invalid or expired promo code."
        );
      }
      appliedPromo = "GRIDVIP2207";
      discountAmount = total; // GRIDVIP is always free
    } else if (normalizedPromo) {
      // Validate other promo codes from Firestore
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
    const shouldBypassStripe = finalTotal === 0;
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
      total: finalTotal,
      discount: discountAmount,
      currency,
      promoCode: appliedPromo,
      promoCodeId,
      status: shouldBypassStripe ? "paid" : "pending",
      paymentMethod: "stripe_payment_sheet",
      createdAt: now,
      updatedAt: now,
    };

    // --- Handle Free/VIP Orders ---
    if (shouldBypassStripe) {
      await db.runTransaction(async (tx) => {
        tx.set(db.doc(`orders/${orderId}`), orderDoc);
        await _fulfillOrder(tx, {
          eventId,
          eventRef,
          userId,
          orderId,
          items: itemsForOrder,
          promoCode: appliedPromo,
          promoCodeId,
        });
      });
      return {
        orderId,
        free: total === 0,
        vip: appliedPromo === "GRIDVIP2207",
      };
    }

    // --- Create Pending Order and Stripe Payment Intent for Paid Orders ---
    await db.doc(`orders/${orderId}`).set(orderDoc);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalTotal * 100),
      currency,
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
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create a Payment Intent."
      );
    }

    await db
      .doc(`orders/${orderId}`)
      .update({ stripePaymentIntentId: paymentIntent.id });

    return {
      orderId,
      clientSecret: paymentIntent.client_secret,
    };
  }
);

/**
 * Updates an order with table contact details. This is callable by EITHER web or mobile.
 */
export const updateOrderContactDetails = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to update an order."
      );
    }
    const userId = context.auth.uid;
    const { orderId, contactDetails } = data as {
      orderId: string;
      contactDetails: {
        fullName: string;
        email: string;
        phone: string;
        notes?: string;
      };
    };

    if (
      !orderId ||
      !contactDetails ||
      !contactDetails.fullName ||
      !contactDetails.email ||
      !contactDetails.phone
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: orderId and full contact details."
      );
    }

    const orderRef = db.doc(`orders/${orderId}`);

    try {
      const docSnap = await orderRef.get();
      if (!docSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Order not found.");
      }

      const orderData = docSnap.data();
      if (orderData?.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to update this order."
        );
      }

      const updatePayload = {
        tableContactDetails: {
          fullName: contactDetails.fullName,
          email: contactDetails.email,
          phone: contactDetails.phone,
          notes: contactDetails.notes || null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await orderRef.update(updatePayload);

      return {
        success: true,
        message: "Contact details updated successfully.",
      };
    } catch (error) {
      console.error("Error updating contact details:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred while processing your request."
      );
    }
  }
);

export const helloWorld = functions.https.onRequest((_req, res) => {
  res.send("Hello from Tekplanet!");
});

/**
 * [REFACTORED] Creates a Stripe Checkout session for web clients.
 */
export const createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    const { eventId, selectedTiers, promoCode } = data;

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

      // Check legacy hardcoded code first
      if (upperCode === "GRIDVIP2207") {
        discountAmount = total;
        validatedPromoCode = upperCode;
      } else {
        // Query Firestore for promo code
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
    }

    const finalTotal = Math.max(0, total - discountAmount);

    // Create order document first
    const orderRef = db.collection("orders").doc();
    const orderData: Record<string, any> = {
      userId,
      eventId,
      eventTitle,
      items,
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

        // Update quantities
        for (const item of items) {
          const tierRef = db
            .collection("events")
            .doc(eventId)
            .collection("ticketTiers")
            .doc(item.tierId);
          tx.update(tierRef, {
            quantitySold: admin.firestore.FieldValue.increment(item.quantity),
          });
        }

        // Increment promo redemption if not legacy code
        if (promoCodeId) {
          incrementPromoRedemption(tx, promoCodeId);
        }
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
  const { eventId, selectedTiers, promoCode, paymentMethodId } = data;

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
  const isGridVip = normalizedPromo === "GRIDVIP2207";
  let appliedPromo: string | null = null;
  let promoCodeId: string | null = null;
  let discountAmount = 0;

  if (isGridVip) {
    const promo = await validateGridVip(eventId);
    if (!promo.ok) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Invalid or expired promo code."
      );
    }
    appliedPromo = "GRIDVIP2207";
    discountAmount = total;
  } else if (normalizedPromo) {
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
        promoCode: appliedPromo,
        promoCodeId,
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
          orderId,
          eventId,
          eventTitle: event.title || "Event",
          userId: uid,
          items: itemsForOrder,
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
          promoCode: appliedPromo,
          promoCodeId,
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
          promoCode: order.promoCode,
          promoCodeId: order.promoCodeId,
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
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can perform this action."
    );
  }
  const { uid, isAdmin } = data;
  if (typeof uid !== "string" || typeof isAdmin !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Required: 'uid' (string) and 'isAdmin' (boolean)."
    );
  }
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
    return {
      message: `Success! User ${uid} has been ${
        isAdmin ? "made" : "removed as"
      } an admin.`,
    };
  } catch (error) {
    console.error("Failed to set custom claims:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while setting the custom claim."
    );
  }
});


