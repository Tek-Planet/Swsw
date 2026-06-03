import * as functions from "firebase-functions/v1";
import Stripe from "stripe";
import { admin, db } from "./lib/firebase";
import Razorpay from "razorpay";
import * as crypto from "crypto";
import { fulfilMovieSeatsForOrder } from "./movies";

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2023-10-16",
} as any);

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret,
});

type SelectedTiers = Record<string, number>;
interface AttendeeInfo {
  name: string;
  email: string;
  phone: string;
}

//================================================================================
// HELPER FUNCTIONS
//================================================================================

function assertPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n > 0;
}

async function validatePromoCode(eventId: string, code: string) {
  const promoQuery = db
    .collection("promoCodes")
    .where("eventId", "==", eventId)
    .where("code", "==", code);

  const snapshot = await promoQuery.get();
  if (snapshot.empty) return { ok: false as const, reason: "not_found" };

  const promoDoc = snapshot.docs[0];
  const promoData = promoDoc.data();

  if (!promoData.isActive) return { ok: false as const, reason: "inactive" };

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
    applicableTierIds: promoData.applicableTierIds,
    waiveProcessingFee: promoData.waiveProcessingFee === true,
  };
}

function calculateDiscount(
  discountType: "percent" | "fixed" | "free",
  discountValue: number,
  baseAmount: number // Changed from 'total' for clarity
): number {
  switch (discountType) {
    case "free":
      return baseAmount;
    case "percent":
      return Math.round((baseAmount * discountValue) / 100);
    case "fixed":
      return Math.min(discountValue, baseAmount);
    default:
      return 0;
  }
}

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

  const processingFee =
    feeBase > 0 ? Math.round(feeBase * (bookingFeePercent / 100)) : 0;
  const totalBeforeDiscount = subtotalCharged + processingFee;

  return {
    event,
    eventRef,
    itemsForOrder,
    subtotalCharged,
    feeBase,
    processingFee,
    totalBeforeDiscount,
    currency,
    bookingFeePercent,
  };
}

function _calculateDiscountableSubtotal(
  items: any[],
  applicableTierIds: string[]
): number {
  if (!applicableTierIds || applicableTierIds.length === 0) {
    return items.reduce(
      (acc, item) => acc + item.chargeAmount * item.quantity,
      0
    );
  }

  return items.reduce((acc, item) => {
    if (applicableTierIds.includes(item.tierId)) {
      return acc + item.chargeAmount * item.quantity;
    }
    return acc;
  }, 0);
}

async function _fulfillOrder(
  tx: admin.firestore.Transaction,
  {
    eventId,
    eventRef,
    userId,
    orderId,
    items,
    promoCodeId,
    attendees,
    donor,
  }: {
    eventId: string;
    eventRef: FirebaseFirestore.DocumentReference;
    userId: string;
    orderId: string;
    items: any[];
    promoCodeId?: string | null;
    attendees?: AttendeeInfo[];
    donor?: AttendeeInfo;
  }
) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const orderRef = db.doc(`orders/${orderId}`);

  tx.set(orderRef, { status: "paid", updatedAt: now }, { merge: true });

  tx.update(eventRef, {
    attendeeIds: admin.firestore.FieldValue.arrayUnion(userId),
  });

  const tiersCol = db
    .collection("events")
    .doc(eventId)
    .collection("ticketTiers");

  for (const item of items || []) {
    if (item.tierId.startsWith("seat_")) continue; // Skip seat-based items
    tx.set(
      tiersCol.doc(item.tierId),
      { quantitySold: admin.firestore.FieldValue.increment(item.quantity) },
      { merge: true }
    );

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

  if (attendees && attendees.length > 0) {
    const attendeesCol = eventRef.collection("attendees");
    attendees.forEach((attendee, idx) => {
      const attendeeRef = attendeesCol.doc(`${orderId}_${idx}`);
      tx.set(
        attendeeRef,
        {
          orderId,
          purchaserId: userId,
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          createdAt: now,
        },
        { merge: true }
      );
    });
  }

  if (promoCodeId) {
    await incrementPromoRedemption(tx, promoCodeId);
  }

  if (donor) {
    tx.update(orderRef, { donor: donor, updatedAt: now });
  }
}

//================================================================================
// PUBLIC CLOUD FUNCTIONS
//================================================================================

/**
 * Creates a Payment Intent for use with the mobile app's Payment Sheet.
 * THIS FUNCTION IS NOW FIXED TO SUPPORT BOTH MOVIE SEATS AND TIERED EVENTS.
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

    const {
      eventId,
      selectedTiers,
      selectedSeats,
      promoCode,
      attendees,
      donor,
    } = data as {
      eventId?: string;
      selectedTiers?: SelectedTiers;
      selectedSeats?: string[];
      promoCode?: string;
      attendees?: AttendeeInfo[];
      donor?: AttendeeInfo;
    };

    if (!eventId || (!selectedTiers && !selectedSeats)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing eventId, selectedTiers, or selectedSeats."
      );
    }

    const eventRef = db.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Event not found.");
    }
    const event = eventSnap.data()!;
    const currency = (event.currency || "INR").toUpperCase();
    const feePercent = event.bookingFeePercent ?? 10;

    let itemsForOrder: any[] = [];
    let subtotalCharged = 0;
    let feeBase = 0;
    let seatIds: string[] = [];

    // --- MOVIE SEAT LOGIC (Copied from createCheckoutSession) ---
    if (Array.isArray(selectedSeats) && selectedSeats.length > 0) {
      seatIds = selectedSeats;
      if (seatIds.length > 10) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Maximum 10 seats per order."
        );
      }
      const seatsCol = eventRef.collection("seats");
      const now = admin.firestore.Timestamp.now();
      const expiresAt = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + 8 * 60 * 1000 // 8 minutes
      );

      await db.runTransaction(async (tx) => {
        const refs = seatIds.map((id) => seatsCol.doc(id));
        const snaps = await Promise.all(refs.map((r) => tx.get(r)));
        for (let i = 0; i < snaps.length; i++) {
          const s = snaps[i];
          const id = seatIds[i];
          if (!s.exists) {
            throw new functions.https.HttpsError(
              "not-found",
              `Seat ${id} not found.`
            );
          }
          const seat = s.data()!;
          const isMine = seat.heldBy === userId;
          const expired =
            seat.heldUntil && seat.heldUntil.toMillis() < now.toMillis();
          const available =
            seat.status === "available" ||
            isMine ||
            (seat.status === "held" && expired);
          if (!available) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              `Seat ${id} is no longer available.`
            );
          }
          const price = Number(seat.price ?? 0);
          subtotalCharged += price;
          feeBase += price; // For movies, fee base is the same as subtotal
          itemsForOrder.push({
            tierId: `seat_${id}`,
            tierName: `Row ${seat.rowLabel}, Seat ${seat.seatLabel}`,
            tierType: "ticket",
            seatId: id,
            rowLabel: seat.rowLabel,
            seatLabel: seat.seatLabel,
            price,
            chargeAmount: price,
            quantity: 1,
          });
          tx.update(refs[i], {
            status: "held",
            heldBy: userId,
            heldUntil: expiresAt,
            updatedAt: now,
          });
        }
      });
    }
    // --- REGULAR TIER LOGIC ---
    else if (selectedTiers) {
      const details = await _calculateOrderDetails(eventId, selectedTiers);
      itemsForOrder = details.itemsForOrder;
      subtotalCharged = details.subtotalCharged;
      feeBase = details.feeBase;
    }

    let processingFee = Math.round(feeBase * (feePercent / 100));

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
      const discountableSubtotal = _calculateDiscountableSubtotal(
        itemsForOrder,
        promo.applicableTierIds
      );
      discountAmount = calculateDiscount(
        promo.discountType,
        promo.discountValue,
        discountableSubtotal
      );

      if (promo.waiveProcessingFee) {
        processingFee = 0;
      }
    }

    const finalTotal = Math.max(
      0,
      subtotalCharged - discountAmount + processingFee
    );
    const orderId = db.collection("orders").doc().id;
    const now = admin.firestore.FieldValue.serverTimestamp();

    // --- Create Order Document ---
    const orderDoc: any = {
      orderId,
      eventId,
      eventTitle: event.title || "Event",
      userId,
      items: itemsForOrder,
      attendees: attendees ?? null,
      donor: donor ?? null,
      subtotal: subtotalCharged,
      feeBase,
      processingFee: finalTotal === 0 ? 0 : processingFee,
      total: finalTotal,
      discount: discountAmount,
      currency,
      promoCode: appliedPromo,
      promoCodeId,
      status: finalTotal === 0 ? "paid" : "pending",
      paymentMethod: "stripe_payment_sheet",
      createdAt: now,
      updatedAt: now,
    };
    if (seatIds.length > 0) {
      orderDoc.orderType = "movie";
      orderDoc.seatIds = seatIds;
    }

    // --- Handle Free Orders ---
    if (finalTotal === 0) {
      await db.runTransaction(async (tx) => {
        tx.set(db.doc(`orders/${orderId}`), orderDoc);
        await _fulfillOrder(tx, {
          eventId,
          eventRef,
          userId,
          orderId,
          items: itemsForOrder,
          promoCodeId,
          attendees,
          donor,
        });
        if (seatIds.length > 0) {
          await fulfilMovieSeatsForOrder({ eventId, userId, orderId, seatIds });
        }
      });
      return {
        orderId,
        free: true,
      };
    }

    // --- Paid Orders ---
    await db.doc(`orders/${orderId}`).set(orderDoc);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalTotal * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId, eventId, userId },
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

    return { orderId, clientSecret: paymentIntent.client_secret };
  }
);

export const createRazorpayOrder = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in."
      );
    }
    const userId = context.auth.uid;

    const { eventId, selectedTiers, promoCode, attendees, donor } = data as {
      eventId?: string;
      selectedTiers?: SelectedTiers;
      promoCode?: string;
      attendees?: AttendeeInfo[];
      donor?: AttendeeInfo;
    };

    if (!eventId || !selectedTiers) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing eventId or selectedTiers."
      );
    }

    let {
      event,
      eventRef,
      itemsForOrder,
      subtotalCharged,
      feeBase,
      processingFee,
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
      const discountableSubtotal = _calculateDiscountableSubtotal(
        itemsForOrder,
        promo.applicableTierIds
      );
      discountAmount = calculateDiscount(
        promo.discountType,
        promo.discountValue,
        discountableSubtotal
      );

      if (promo.waiveProcessingFee) {
        processingFee = 0;
      }
    }

    const finalTotal = Math.max(
      0,
      subtotalCharged - discountAmount + processingFee
    );
    const orderId = db.collection("orders").doc().id;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const orderDoc: any = {
      orderId,
      eventId,
      eventTitle: event.title || "Event",
      userId,
      items: itemsForOrder,
      attendees: attendees ?? null,
      donor: donor ?? null,
      subtotal: subtotalCharged,
      feeBase,
      processingFee,
      total: finalTotal,
      discount: discountAmount,
      currency,
      promoCode: appliedPromo,
      promoCodeId,
      status: finalTotal === 0 ? "paid" : "pending",
      paymentMethod: "razorpay",
      createdAt: now,
      updatedAt: now,
    };

    if (finalTotal === 0) {
      await db.runTransaction(async (tx) => {
        tx.set(db.doc(`orders/${orderId}`), orderDoc);
        await _fulfillOrder(tx, {
          eventId,
          eventRef,
          userId,
          orderId,
          items: itemsForOrder,
          promoCodeId,
          attendees,
          donor,
        });
      });
      return { orderId, free: true };
    }

    await db.doc(`orders/${orderId}`).set(orderDoc);

    const razorpayOptions = {
      amount: Math.round(finalTotal * 100),
      currency: currency,
      receipt: orderId,
      notes: {
        eventId,
        userId,
      },
    };

    try {
      const razorpayOrder = await razorpay.orders.create(razorpayOptions);

      await db
        .doc(`orders/${orderId}`)
        .update({ razorpayOrderId: razorpayOrder.id });

      return {
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      };
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create a Razorpay order."
      );
    }
  }
);

export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const secret = functions.config().razorpay.webhook_secret;
  const signature = req.headers["x-razorpay-signature"];

  if (!signature) {
    res.status(400).send("Missing Razorpay signature");
    return;
  }

  try {
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== signature) {
      res.status(400).send("Invalid webhook signature");
      return;
    }

    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      const { order_id: razorpayOrderId } = payment;
      const ourOrderId = payment.receipt;

      if (!ourOrderId) {
        console.warn(
          "Webhook ignored: Missing our orderId in receipt",
          razorpayOrderId
        );
        res.status(200).send("Ignoring event with missing receipt.");
        return;
      }

      const orderRef = db.doc(`orders/${ourOrderId}`);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        console.error("Webhook failed: Order not found", ourOrderId);
        res.status(404).send("Order not found");
        return;
      }

      const order = orderSnap.data() as any;
      const { eventId, userId } = order;
      const eventRef = db.doc(`events/${eventId}`);

      if (order.status === "paid") {
        console.log("Webhook ignored: Order already fulfilled", ourOrderId);
        res.status(200).send("Order already fulfilled.");
        return;
      }

      await db.runTransaction(async (tx) => {
        await _fulfillOrder(tx, {
          eventId,
          eventRef,
          userId,
          orderId: ourOrderId,
          items: order.items,
          promoCodeId: order.promoCodeId,
          attendees: order.attendees,
          donor: order.donor,
        });

        tx.update(orderRef, {
          status: "paid",
          razorpayPaymentId: payment.id,
          razorpaySignature: signature,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    } else if (event === "payment.failed") {
      const payment = req.body.payload.payment.entity;
      const ourOrderId = payment.receipt;
      if (ourOrderId) {
        const orderRef = db.doc(`orders/${ourOrderId}`);
        const orderSnap = await orderRef.get();
        if (orderSnap.exists && orderSnap.data()?.status === "pending") {
          await orderRef.update({
            status: "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`Order ${ourOrderId} marked as failed.`);
        }
      }
    }

    res.status(200).send("ok");
  } catch (err: any) {
    console.error("Webhook processing failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export const verifyRazorpayPayment = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in."
      );
    }

    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      data as {
        orderId?: string;
        razorpayPaymentId?: string;
        razorpayOrderId?: string;
        razorpaySignature?: string;
      };

    if (
      !orderId ||
      !razorpayPaymentId ||
      !razorpayOrderId ||
      !razorpaySignature
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required Razorpay payment details."
      );
    }

    const secret = functions.config().razorpay.key_secret;

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generated_signature !== razorpaySignature) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Invalid Razorpay signature."
      );
    }

    const orderRef = db.doc(`orders/${orderId}`);

    try {
      await db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists) {
          throw new functions.https.HttpsError("not-found", "Order not found.");
        }

        const order = orderSnap.data() as any;

        if (order.status === "paid") {
          console.log("Verification skipped: Order already fulfilled", orderId);
          return;
        }

        if (order.razorpayOrderId !== razorpayOrderId) {
          throw new functions.https.HttpsError(
            "permission-denied",
            "Mismatched Razorpay Order ID."
          );
        }

        const { eventId, userId, items, promoCodeId, attendees, donor } = order;
        const eventRef = db.doc(`events/${eventId}`);

        await _fulfillOrder(tx, {
          eventId,
          eventRef,
          userId,
          orderId,
          items,
          promoCodeId,
          attendees,
          donor,
        });

        tx.update(orderRef, {
          status: "paid",
          razorpayPaymentId,
          razorpaySignature,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return {
        success: true,
        orderId: orderId,
        message: "Payment verified and order fulfilled.",
      };
    } catch (error) {
      console.error("Razorpay verification and fulfillment failed:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Failed to process Razorpay payment verification."
      );
    }
  }
);

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

export const createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    const {
      eventId,
      selectedTiers,
      selectedSeats,
      promoCode,
      attendees,
      donor,
    } = data as {
      eventId?: string;
      selectedTiers?: Record<string, number>;
      selectedSeats?: string[];
      promoCode?: string;
      attendees?: AttendeeInfo[];
      donor?: AttendeeInfo;
    };

    if (!eventId || (!selectedTiers && !selectedSeats)) {
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

    const eventDoc = await db.collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Event not found");
    }
    const eventData = eventDoc.data()!;
    const eventTitle = eventData.title || "Event";
    const currency = (eventData.currency || "INR").toUpperCase();
    const feePercent = eventData.bookingFeePercent ?? 10;

    if (Array.isArray(selectedSeats) && selectedSeats.length > 0) {
      if (selectedSeats.length > 10) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Maximum 10 seats per order."
        );
      }
      const seatsCol = db.collection("events").doc(eventId).collection("seats");
      const now = admin.firestore.Timestamp.now();
      const expiresAt = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + 8 * 60 * 1000
      );

      const orderRef = db.collection("orders").doc();
      const seatItems: any[] = [];
      let seatSubtotal = 0;

      await db.runTransaction(async (tx) => {
        const refs = selectedSeats.map((id) => seatsCol.doc(id));
        const snaps = await Promise.all(refs.map((r) => tx.get(r)));
        for (let i = 0; i < snaps.length; i++) {
          const s = snaps[i];
          const id = selectedSeats[i];
          if (!s.exists) {
            throw new functions.https.HttpsError(
              "not-found",
              `Seat ${id} not found.`
            );
          }
          const seat = s.data() as any;
          const isMine = seat.heldBy === userId;
          const expired =
            seat.heldUntil &&
            seat.heldUntil.toMillis &&
            seat.heldUntil.toMillis() < now.toMillis();
          const available =
            seat.status === "available" ||
            isMine ||
            (seat.status === "held" && expired);
          if (!available) {
            throw new functions.https.HttpsError(
              "failed-precondition",
              `Seat ${id} is no longer available.`
            );
          }
          const price = Number(seat.price ?? 0);
          seatSubtotal += price;
          seatItems.push({
            tierId: `seat_${id}`,
            tierName: `Row ${seat.rowLabel}, Seat ${seat.seatLabel}`,
            tierType: "ticket",
            seatId: id,
            rowLabel: seat.rowLabel,
            seatLabel: seat.seatLabel,
            price,
            chargeAmount: price,
            quantity: 1,
          });
          tx.update(refs[i], {
            status: "held",
            heldBy: userId,
            heldUntil: expiresAt,
            orderId: orderRef.id,
            updatedAt: now,
          });
        }
      });

      const seatProcessingFee = Math.round(seatSubtotal * (feePercent / 100));
      const seatTotal = seatSubtotal + seatProcessingFee;

      const orderData: Record<string, any> = {
        userId,
        eventId,
        eventTitle,
        items: seatItems,
        seatIds: selectedSeats,
        attendees: attendees ?? null,
        donor: donor ?? null,
        subtotal: seatSubtotal,
        feeBase: seatSubtotal,
        processingFee: seatProcessingFee,
        total: seatTotal,
        currency,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentMethod: "stripe_checkout",
        orderType: "movie",
      };
      await orderRef.set(orderData);

      const seatLineItems: any[] = seatItems.map((it) => ({
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(it.chargeAmount * 100),
          product_data: {
            name: `${eventTitle} — ${it.tierName}`,
            description: "Cinema seat",
          },
        },
        quantity: 1,
      }));
      if (seatProcessingFee > 0) {
        seatLineItems.push({
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(seatProcessingFee * 100),
            product_data: {
              name: "Processing Fee",
              description: "Booking and transaction fee",
            },
          },
          quantity: 1,
        });
      }

      const seatSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: seatLineItems,
        mode: "payment",
        expires_at: Math.floor(now.toMillis() / 1000) + 30 * 60,
        success_url: `${functions.config().app.url}/success?orderId=${
          orderRef.id
        }`,
        cancel_url: `${functions.config().app.url}/cancel?orderId=${
          orderRef.id
        }`,
        metadata: {
          orderId: orderRef.id,
          userId: userId,
          eventId: eventId,
          orderType: "movie",
        },
      });

      await orderRef.update({ stripeSessionId: seatSession.id });
      return { url: seatSession.url, orderId: orderRef.id };
    }

    const tiersSnapshot = await db
      .collection("events")
      .doc(eventId)
      .collection("ticketTiers")
      .get();

    const tiers: Record<string, any> = {};
    tiersSnapshot.forEach((doc) => {
      tiers[doc.id] = { id: doc.id, ...doc.data() };
    });

    let subtotal = 0;
    let feeBase = 0;
    const items: any[] = [];

    for (const [tierId, qty] of Object.entries(selectedTiers || {})) {
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

    let processingFee = Math.round(feeBase * (feePercent / 100));

    let discountAmount = 0;
    let promoCodeId: string | null = null;
    let validatedPromoCode: string | null = null;

    if (promoCode) {
      const upperCode = promoCode.trim().toUpperCase();

      const promoData = await validatePromoCode(eventId, upperCode);
      if (promoData && promoData.ok) {
        const discountableSubtotal = _calculateDiscountableSubtotal(
          items,
          promoData.applicableTierIds
        );
        discountAmount = calculateDiscount(
          promoData.discountType,
          promoData.discountValue,
          discountableSubtotal
        );
        promoCodeId = promoData.promoId;
        validatedPromoCode = upperCode;

        if (promoData.waiveProcessingFee) {
          processingFee = 0;
        }
      }
    }

    const finalTotal = Math.max(0, subtotal - discountAmount + processingFee);

    const orderRef = db.collection("orders").doc();
    const orderData: Record<string, any> = {
      userId,
      eventId,
      eventTitle,
      items,
      attendees: attendees ?? null,
      donor: donor ?? null,
      subtotal,
      feeBase,
      processingFee,
      total: finalTotal,
      currency,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: "stripe_checkout",
    };

    if (discountAmount > 0) {
      orderData.discount = discountAmount;
      orderData.promoCode = validatedPromoCode;
      if (promoCodeId) {
        orderData.promoCodeId = promoCodeId;
      }
    }

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
          donor,
        });
      });

      return { orderId: orderRef.id, free: true };
    }

    await orderRef.set(orderData);

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

    if (processingFee > 0) {
      line_items.push({
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(processingFee * 100),
          product_data: {
            name: "Processing Fee",
            description: "Booking and transaction fee",
          },
        },
        quantity: 1,
      });
    }

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

export const gpayCharge = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in."
    );
  }
  const uid = context.auth.uid;
  const {
    eventId,
    selectedTiers,
    promoCode,
    paymentMethodId,
    attendees,
    donor,
  } = data;

  if (!eventId || !selectedTiers || !paymentMethodId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: eventId, selectedTiers, paymentMethodId."
    );
  }

  let {
    event,
    eventRef,
    itemsForOrder,
    subtotalCharged,
    feeBase,
    processingFee,
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
    const discountableSubtotal = _calculateDiscountableSubtotal(
      itemsForOrder,
      promo.applicableTierIds
    );
    discountAmount = calculateDiscount(
      promo.discountType,
      promo.discountValue,
      discountableSubtotal
    );

    if (promo.waiveProcessingFee) {
      processingFee = 0;
    }
  }

  const finalTotal = Math.max(
    0,
    subtotalCharged - discountAmount + processingFee
  );
  const orderId = db.collection("orders").doc().id;

  if (finalTotal === 0) {
    await db.runTransaction(async (tx) => {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const orderDoc = {
        orderId,
        eventId,
        eventTitle: event.title || "Event",
        userId: uid,
        items: itemsForOrder,
        attendees,
        donor,
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
        donor,
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
          attendees,
          donor,
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
          donor,
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

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).send("Missing Stripe signature");
    return;
  }

  let evt: Stripe.Event;
  try {
    evt = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig,
      functions.config().stripe.webhook_secret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

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

    if (order.status === "paid") {
      console.log("Webhook ignored: Order already fulfilled", orderId);
      res.status(200).send("Order already fulfilled.");
      return;
    }

    await db.runTransaction(async (tx) => {
      await _fulfillOrder(tx, {
        eventId,
        eventRef,
        userId,
        orderId,
        items: order.items,
        promoCodeId: order.promoCodeId,
        attendees: order.attendees,
        donor: order.donor,
      });
    });

    if (
      order.orderType === "movie" &&
      Array.isArray(order.seatIds) &&
      order.seatIds.length > 0
    ) {
      try {
        await fulfilMovieSeatsForOrder({
          eventId,
          userId,
          orderId,
          seatIds: order.seatIds,
        });
      } catch (e: any) {
        console.error(
          `Failed to fulfil movie seats for order ${orderId}:`,
          e?.message || e
        );
      }
    }
  } else if (evt.type === "checkout.session.expired") {
    const session = evt.data.object as Stripe.Checkout.Session;
    const { orderId } = session.metadata || {};

    if (orderId) {
      const orderRef = db.doc(`orders/${orderId}`);
      const orderSnap = await orderRef.get();
      if (orderSnap.exists && orderSnap.data()?.status === "pending") {
        const o = orderSnap.data() as any;
        await orderRef.update({
          status: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(
          `Order ${orderId} marked as failed due to session expiration.`
        );
        if (
          o.orderType === "movie" &&
          Array.isArray(o.seatIds) &&
          o.seatIds.length > 0
        ) {
          const seatsCol = db
            .collection("events")
            .doc(o.eventId)
            .collection("seats");
          const batch = db.batch();
          o.seatIds.forEach((id: string) => {
            batch.update(seatsCol.doc(id), {
              status: "available",
              heldBy: null,
              heldUntil: null,
              orderId: null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch
            .commit()
            .catch((e) => console.error("Seat release on expiry failed", e));
        }
      }
    }
  }

  res.status(200).send("ok");
});

export const manuallyFulfillOrder = functions.https.onCall(
  async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "This function can only be called by an administrator."
      );
    }

    const { orderId } = data as { orderId?: string };

    if (!orderId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with an 'orderId'."
      );
    }

    const orderRef = db.doc(`orders/${orderId}`);
    const now = admin.firestore.FieldValue.serverTimestamp();

    try {
      await db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists) {
          throw new functions.https.HttpsError("not-found", "Order not found.");
        }

        const order = orderSnap.data() as any;

        if (order.status === "paid") {
          console.warn(
            `Order ${orderId} is already fulfilled. No action taken.`
          );
          return;
        }

        const { eventId, userId, items, promoCodeId, attendees, donor } = order;
        if (!eventId || !userId || !items) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "Order document is missing required fields (eventId, userId, items)."
          );
        }

        const eventRef = db.doc(`events/${eventId}`);

        await _fulfillOrder(tx, {
          eventId,
          eventRef,
          userId,
          orderId,
          items,
          promoCodeId,
          attendees,
          donor,
        });

        tx.update(orderRef, {
          status: "paid",
          paidAt: now,
          manuallyFulfilledBy: context.auth?.uid,
          manuallyFulfilledAt: now,
          updatedAt: now,
        });
      });

      return {
        success: true,
        message: `Order ${orderId} marked as paid and fulfilled.`,
      };
    } catch (error) {
      console.error(`Failed to manually fulfill order ${orderId}:`, error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred during manual fulfillment."
      );
    }
  }
);

export const cleanupExpiredOrders = functions.pubsub
  .schedule("0 0 * * *")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(
      now.toMillis() - 24 * 60 * 60 * 1000
    );

    const pendingOrdersQuery = db
      .collection("orders")
      .where("status", "==", "pending")
      .where("createdAt", "<=", twentyFourHoursAgo);

    const snapshot = await pendingOrdersQuery.get();

    if (snapshot.empty) {
      console.log("No expired pending orders to clean up.");
      return null;
    }

    const batch = db.batch();
    snapshot.forEach((doc) => {
      console.log(`Marking order ${doc.id} as failed.`);
      const orderRef = db.collection("orders").doc(doc.id);
      batch.update(orderRef, {
        status: "failed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`Cleaned up ${snapshot.size} expired orders.`);
    return null;
  });

export const cancelOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to cancel an order."
    );
  }
  const userId = context.auth.uid;
  const { orderId } = data as { orderId: string };

  if (!orderId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required field: orderId."
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
        "You do not have permission to cancel this order."
      );
    }

    if (orderData.status !== "pending") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Order cannot be canceled because its status is '${orderData.status}'.`
      );
    }

    await orderRef.update({
      status: "canceled",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Order has been successfully canceled.",
    };
  } catch (error) {
    console.error("Error canceling order:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while canceling the order."
    );
  }
});
