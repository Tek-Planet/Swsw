import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2025-11-17.clover",
});

type SelectedTiers = Record<string, number>;

function assertPositiveInt(n: unknown) {
  return typeof n === "number" && Number.isInteger(n) && n > 0;
}

/**
 * Validates GRIDVIP promo code stored at: promoCodes/GRIDVIP
 * Supports optional restriction field: eventId
 * Supports redemption caps: maxRedemptions, redeemedCount
 */
async function validateGridVip(eventId: string) {
  const ref = db.collection("promoCodes").doc("GRIDVIP2207");
  const snap = await ref.get();
  if (!snap.exists) return { ok: false as const, ref };

  const data = snap.data() as any;

  if (data.isActive !== true) return { ok: false as const, ref };

  // Optional: restrict promo to specific event
  if (data.eventId && data.eventId !== eventId) return { ok: false as const, ref };

  const max = Number(data.maxRedemptions ?? 0);
  const used = Number(data.redeemedCount ?? 0);

  // If maxRedemptions is 0 or missing, treat as unlimited
  if (max > 0 && used >= max) return { ok: false as const, ref };

  return { ok: true as const, ref };
}

export const helloWorld = functions.https.onRequest(
  (_req: functions.Request, res: functions.Response) => {
    res.send("Hello from Tekplanet!");
  }
);

export const createCheckoutSession = functions.https.onCall(
  async (data, context: functions.https.CallableContext) => {
    console.log("createCheckoutSession called");

    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
    }

    const uid = context.auth.uid;
    const { eventId, selectedTiers, promoCode } = data as {
      eventId?: string;
      selectedTiers?: SelectedTiers;
      promoCode?: string;
    };

    if (!eventId || !selectedTiers || typeof selectedTiers !== "object") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing eventId or selectedTiers."
      );
    }

    const eventRef = db.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Event not found.");
    }

    const event = eventSnap.data() || {};
    if (event.status && event.status !== "published") {
      throw new functions.https.HttpsError("failed-precondition", "Event is not available.");
    }

    const tierIds = Object.keys(selectedTiers);
    if (tierIds.length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "No ticket tiers selected.");
    }

    for (const tierId of tierIds) {
      if (!assertPositiveInt(selectedTiers[tierId])) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid quantity.");
      }
    }

    const tiersCol = eventRef.collection("ticketTiers");
    const tierSnaps = await Promise.all(tierIds.map((id) => tiersCol.doc(id).get()));

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const itemsForOrder: any[] = [];

    // subtotalCharged: what the customer pays now (tickets + deposits + addons)
    let subtotalCharged = 0;

    // feeBase: only the categories that should have 10% processing fee
    // ✅ your final rule:
    // - tickets: fee applies
    // - addons: fee applies (photo access should have fee)
    // - tables (deposits): NO fee
    let feeBase = 0;

    for (const snap of tierSnaps) {
      if (!snap.exists) {
        throw new functions.https.HttpsError("not-found", `Ticket tier not found: ${snap.id}`);
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

      // price = FULL/DISPLAY price
      const displayPrice = Number(tier.price);

      // chargeAmount = amount to charge now (deposit for tables, else price)
      const chargeAmount =
        tier.chargeAmount != null ? Number(tier.chargeAmount) : displayPrice;

      // ✅ allow 0-priced tiers (e.g., Ladies Free); disallow negative / NaN
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

      // Optional inventory check
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

      // Stripe line item uses chargeAmount (deposit or ticket/addon charge)
      if (chargeAmount > 0) {
        line_items.push({
          price_data: {
            currency: "inr",
            product_data: { name: `${event.title} - ${tier.name}` },
            unit_amount: Math.round(chargeAmount * 100), // INR -> paise
          },
          quantity: qty,
        });
      }

      // Store both display and charged values for receipts/UI
      itemsForOrder.push({
        tierId: snap.id,
        name: tier.name,
        type,
        unitPrice: displayPrice, // full/display value
        chargeAmount, // charged now
        quantity: qty,
      });

      const chargedForThisTier = chargeAmount * qty;
      subtotalCharged += chargedForThisTier;

      // ✅ HERE is the rule you asked about:
      // Fee applies to tickets + addons, NOT tables
      const feeApplies = type !== "table";
      if (feeApplies) {
        feeBase += chargedForThisTier;
      }
    }

    // ✅ One-time 10% processing fee applied ONLY to feeBase (non-table items)
    const processingFee = feeBase > 0 ? Math.round(feeBase * 0.1) : 0;

    // total charged now = deposits/tickets/addons + fee (fee excludes tables)
    const total = subtotalCharged + processingFee;

    // Promo handling: GRIDVIP => total becomes 0 (bypass Stripe)
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

    // Bypass Stripe if:
    // - GRIDVIP applied
    // - OR total is 0 (e.g. only Ladies free selected)
    const shouldBypassStripe = appliedPromo === "GRIDVIP2207" || total === 0;

    const orderId = db.collection("_").doc().id;
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Store eventTitle for display purposes
    const eventTitle = event.title || "Event";

    const orderDoc: any = {
      orderId,
      eventId,
      eventTitle,
      userId: uid,
      items: itemsForOrder,

      // Store charged subtotal separately from fee base for clarity
      subtotal: subtotalCharged, // amount charged excluding processing fee
      feeBase, // amount that fee was computed from
      processingFee: shouldBypassStripe ? 0 : processingFee,
      total: shouldBypassStripe ? 0 : total,

      currency: "INR",
      promoCode: appliedPromo,
      status: shouldBypassStripe ? "paid" : "pending",
      createdAt: now,
      updatedAt: now,
    };

    // ✅ If free-only cart OR GRIDVIP => bypass Stripe and mark paid immediately
    if (shouldBypassStripe) {
      await db.runTransaction(async (tx) => {
        // Write to top-level orders collection
        const orderRef = db.doc(`orders/${orderId}`);
        const tiersColRef = db.collection("events").doc(eventId).collection("ticketTiers");

        tx.set(orderRef, orderDoc);
        
        // Add attendee to event
        tx.update(eventRef, { attendeeIds: admin.firestore.FieldValue.arrayUnion(uid) });

        // Increment sold counts for selected tiers
        for (const item of itemsForOrder) {
          tx.set(
            tiersColRef.doc(item.tierId),
            { quantitySold: admin.firestore.FieldValue.increment(item.quantity) },
            { merge: true }
          );

          // Entitlement: photo access addon unlock
          if (item.type === "addon" && String(item.name).toLowerCase().includes("photo")) {
            tx.set(
              db.doc(`users/${uid}`),
              { hasPhotoAccess: true, updatedAt: now },
              { merge: true }
            );
          }
        }

        // Redeem promo code
        if (appliedPromo === "GRIDVIP2207") {
          const promoRef = db.collection("promoCodes").doc("GRIDVIP2207");
          tx.set(
            promoRef,
            {
              redeemedCount: admin.firestore.FieldValue.increment(1),
              updatedAt: now,
            },
            { merge: true }
          );
        }
      });

      return {
        orderId,
        vip: appliedPromo === "GRIDVIP2207",
        free: appliedPromo !== "GRIDVIP2207", // free-only cart
      };
    }

    // ✅ Paid orders: add processing fee as a Stripe line item (one-time) ONLY if > 0
    // This fee will never apply to table-only orders because feeBase would be 0.
    if (processingFee > 0) {
      line_items.push({
        price_data: {
          currency: "inr",
          product_data: { name: "Processing fee (10%)" },
          unit_amount: processingFee * 100, // INR -> paise
        },
        quantity: 1,
      });
    }

    // Create pending order doc in top-level orders collection
    await db.doc(`orders/${orderId}`).set(orderDoc);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${functions.config().app.url}/success?orderId=${orderId}`,
      cancel_url: `${functions.config().app.url}/cancel?orderId=${orderId}`,
      metadata: {
        orderId,
        eventId,
        userId: uid,
      },
    });

    if (!session.url) {
      throw new functions.https.HttpsError("internal", "Stripe session URL missing.");
    }

    // Update order with Stripe session ID
    await db.doc(`orders/${orderId}`).set(
      { stripeSessionId: session.id, updatedAt: now },
      { merge: true }
    );

    return { url: session.url, orderId };
  }
);

export const stripeWebhook = functions.https.onRequest(
  async (req: functions.Request, res: functions.Response) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("Missing Stripe signature");
      return;
    }

    const webhookSecret = functions.config().stripe.webhook_secret;

    let evt: Stripe.Event;
    try {
      evt = stripe.webhooks.constructEvent((req as any).rawBody, sig as string, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (evt.type !== "checkout.session.completed") {
      res.status(200).send("Ignored");
      return;
    }

    const session = evt.data.object as Stripe.Checkout.Session;
    const { orderId, eventId, userId } = session.metadata || {};

    if (!orderId || !eventId || !userId) {
      res.status(200).send("Missing metadata");
      return;
    }

    // Read from top-level orders collection
    const orderRef = db.doc(`orders/${orderId}`);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      res.status(200).send("Order not found");
      return;
    }

    const order = orderSnap.data() as any;
    const eventRef = db.doc(`events/${eventId}`);

    await db.runTransaction(async (tx) => {
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Update order status in top-level orders collection
      tx.set(orderRef, { status: "paid", updatedAt: now }, { merge: true });

      // Add attendee to event
      tx.update(eventRef, { attendeeIds: admin.firestore.FieldValue.arrayUnion(userId) });

      const tiersCol = db.collection("events").doc(eventId).collection("ticketTiers");

      for (const item of order.items || []) {
        tx.set(
          tiersCol.doc(item.tierId),
          { quantitySold: admin.firestore.FieldValue.increment(item.quantity) },
          { merge: true }
        );

        if (item.type === "addon" && String(item.name).toLowerCase().includes("photo")) {
          tx.set(
            db.doc(`users/${userId}`),
            { hasPhotoAccess: true, updatedAt: now },
            { merge: true }
          );
        }
      }
    });

    res.status(200).send("ok");
  }
);
