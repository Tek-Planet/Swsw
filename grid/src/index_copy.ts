// import GooglePayDecrypt from "@foxy.io/google-pay-decrypt";
// import * as admin from "firebase-admin";
// import * as functions from "firebase-functions/v1";
// import Stripe from "stripe";

// admin.initializeApp();
// const db = admin.firestore();
// const stripe = new Stripe(functions.config().stripe.secret_key, {
//   apiVersion: "2025-11-17.clover",
// });

// type SelectedTiers = Record<string, number>;

// // Helper to assert that a value is a positive integer
// function assertPositiveInt(n: unknown): n is number {
//   return typeof n === "number" && Number.isInteger(n) && n > 0;
// }

// /**
//  * Validates the GRIDVIP promo code.
//  */
// async function validateGridVip(eventId: string) {
//   const ref = db.collection("promoCodes").doc("GRIDVIP2207");
//   const snap = await ref.get();
//   if (!snap.exists) return { ok: false as const };

//   const data = snap.data() as any;
//   if (data.isActive !== true) return { ok: false as const };
//   if (data.eventId && data.eventId !== eventId) return { ok: false as const };

//   const max = Number(data.maxRedemptions ?? 0);
//   const used = Number(data.redeemedCount ?? 0);
//   if (max > 0 && used >= max) return { ok: false as const };

//   return { ok: true as const };
// }

// /**
//  * [EXTRACTED] Calculates order totals, fees, and items based on selected tiers.
//  * This logic is shared between Stripe Checkout and direct Google Pay.
//  */
// async function _calculateOrderDetails(eventId: string, selectedTiers: SelectedTiers) {
//   const eventRef = db.collection("events").doc(eventId);
//   const eventSnap = await eventRef.get();
//   if (!eventSnap.exists) {
//     throw new functions.https.HttpsError("not-found", "Event not found.");
//   }
//   const event = eventSnap.data() || {};
//   if (event.status && event.status !== "published") {
//     throw new functions.https.HttpsError("failed-precondition", "Event is not available.");
//   }

//   const tierIds = Object.keys(selectedTiers);
//   if (tierIds.length === 0) {
//     throw new functions.https.HttpsError("invalid-argument", "No ticket tiers selected.");
//   }
//   for (const tierId of tierIds) {
//     if (!assertPositiveInt(selectedTiers[tierId])) {
//       throw new functions.https.HttpsError("invalid-argument", `Invalid quantity for tier ${tierId}.`);
//     }
//   }

//   const tiersCol = eventRef.collection("ticketTiers");
//   const tierSnaps = await Promise.all(tierIds.map((id) => tiersCol.doc(id).get()));

//   const itemsForOrder: any[] = [];
//   let subtotalCharged = 0;
//   let feeBase = 0;

//   for (const snap of tierSnaps) {
//     if (!snap.exists) throw new functions.https.HttpsError("not-found", `Ticket tier not found: ${snap.id}`);
//     const tier = snap.data() as any;
//     if (tier.isActive !== true) throw new functions.https.HttpsError("failed-precondition", `Ticket tier inactive: ${snap.id}`);

//     const qty = selectedTiers[snap.id];
//     const type: string = tier.type || "ticket";
//     const displayPrice = Number(tier.price);
//     const chargeAmount = tier.chargeAmount != null ? Number(tier.chargeAmount) : displayPrice;

//     if (!Number.isFinite(displayPrice) || displayPrice < 0) throw new functions.https.HttpsError("failed-precondition", `Invalid price for tier: ${snap.id}`);
//     if (!Number.isFinite(chargeAmount) || chargeAmount < 0) throw new functions.https.HttpsError("failed-precondition", `Invalid chargeAmount for tier: ${snap.id}`);

//     if (tier.quantityTotal != null) {
//       const sold = Number(tier.quantitySold || 0);
//       const total = Number(tier.quantityTotal);
//       if (sold + qty > total) throw new functions.https.HttpsError("failed-precondition", `Not enough availability for: ${tier.name}`);
//     }

//     itemsForOrder.push({
//       tierId: snap.id,
//       name: tier.name,
//       type,
//       unitPrice: displayPrice,
//       chargeAmount,
//       quantity: qty,
//     });

//     const chargedForThisTier = chargeAmount * qty;
//     subtotalCharged += chargedForThisTier;

//     if (type !== "table") {
//       feeBase += chargedForThisTier;
//     }
//   }

//   const processingFee = feeBase > 0 ? Math.round(feeBase * 0.1) : 0;
//   const total = subtotalCharged + processingFee;

//   return { event, itemsForOrder, subtotalCharged, feeBase, processingFee, total };
// }

// /**
//  * [EXTRACTED] Marks an order as paid and updates inventory.
//  * This logic is shared between webhooks and direct charges.
//  */
// async function _fulfillOrder(tx: admin.firestore.Transaction, { eventId, userId, orderId, items, promoCode }: any) {
//   const now = admin.firestore.FieldValue.serverTimestamp();
//   const orderUserRef = db.doc(`users/${userId}/orders/${orderId}`);
//   const orderEventRef = db.doc(`events/${eventId}/orders/${orderId}`);

//   tx.set(orderUserRef, { status: "paid", updatedAt: now }, { merge: true });
//   tx.set(orderEventRef, { status: "paid", updatedAt: now }, { merge: true });

//   const tiersCol = db.collection("events").doc(eventId).collection("ticketTiers");
//   for (const item of items || []) {
//     tx.set(tiersCol.doc(item.tierId), { quantitySold: admin.firestore.FieldValue.increment(item.quantity) }, { merge: true });
//     if (item.type === "addon" && String(item.name).toLowerCase().includes("photo")) {
//       tx.set(db.doc(`users/${userId}`), { hasPhotoAccess: true, updatedAt: now }, { merge: true });
//     }
//   }

//   if (promoCode === "GRIDVIP2207") {
//     const promoRef = db.collection("promoCodes").doc("GRIDVIP2207");
//     tx.set(promoRef, { redeemedCount: admin.firestore.FieldValue.increment(1), updatedAt: now }, { merge: true });
//   }
// }

// /**
//  * [REFACTORED] Creates a Stripe Checkout session for web clients.
//  */
// export const createCheckoutSession = functions.https.onCall(async (data, context) => {
//   if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
//   const uid = context.auth.uid;

//   const { eventId, selectedTiers, promoCode } = data as { eventId?: string; selectedTiers?: SelectedTiers; promoCode?: string; };
//   if (!eventId || !selectedTiers) throw new functions.https.HttpsError("invalid-argument", "Missing eventId or selectedTiers.");

//   const { event, itemsForOrder, subtotalCharged, feeBase, processingFee, total } = await _calculateOrderDetails(eventId, selectedTiers);

//   const normalizedPromo = (promoCode || "").trim().toUpperCase();
//   const isGridVip = normalizedPromo === "GRIDVIP2207";
//   let appliedPromo: string | null = null;

//   if (isGridVip) {
//     const promo = await validateGridVip(eventId);
//     if (!promo.ok) throw new functions.https.HttpsError("failed-precondition", "Invalid or expired promo code.");
//     appliedPromo = "GRIDVIP2207";
//   }

//   const shouldBypassStripe = appliedPromo === "GRIDVIP2207" || total === 0;
//   const orderId = db.collection("_").doc().id;
//   const now = admin.firestore.FieldValue.serverTimestamp();

//   const orderDoc: any = {
//     orderId, eventId, userId: uid, items: itemsForOrder,
//     subtotal: subtotalCharged, feeBase,
//     processingFee: shouldBypassStripe ? 0 : processingFee,
//     total: shouldBypassStripe ? 0 : total,
//     currency: "INR", promoCode: appliedPromo,
//     paymentMethod: "stripe_checkout",
//     status: shouldBypassStripe ? "paid" : "pending",
//     createdAt: now, updatedAt: now,
//   };

//   // If free or VIP, fulfill the order immediately, bypassing Stripe
//   if (shouldBypassStripe) {
//     await db.runTransaction(async (tx) => {
//       const orderUserRef = db.doc(`users/${uid}/orders/${orderId}`);
//       const orderEventRef = db.doc(`events/${eventId}/orders/${orderId}`);
//       tx.set(orderUserRef, orderDoc);
//       tx.set(orderEventRef, orderDoc);
//       await _fulfillOrder(tx, orderDoc);
//     });
//     return { orderId, vip: appliedPromo === "GRIDVIP2207", free: total === 0 };
//   }

//   // Create pending order docs for paid orders
//   await db.doc(`users/${uid}/orders/${orderId}`).set(orderDoc);
//   await db.doc(`events/${eventId}/orders/${orderId}`).set(orderDoc);

//   const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = itemsForOrder
//     .filter(item => item.chargeAmount > 0)
//     .map(item => ({
//       price_data: {
//         currency: "inr",
//         product_data: { name: `${event.title} - ${item.name}` },
//         unit_amount: Math.round(item.chargeAmount * 100),
//       },
//       quantity: item.quantity,
//     }));

//   if (processingFee > 0) {
//     line_items.push({
//       price_data: {
//         currency: "inr",
//         product_data: { name: "Processing fee (10%)" },
//         unit_amount: processingFee * 100,
//       },
//       quantity: 1,
//     });
//   }

//   const session = await stripe.checkout.sessions.create({
//     mode: "payment",
//     payment_method_types: ["card"],
//     line_items,
//     success_url: `${functions.config().app.url}/success?orderId=${orderId}`,
//     cancel_url: `${functions.config().app.url}/cancel?orderId=${orderId}`,
//     metadata: { orderId, eventId, userId: uid },
//   });

//   if (!session.url) throw new functions.https.HttpsError("internal", "Stripe session URL missing.");

//   await db.doc(`users/${uid}/orders/${orderId}`).set({ stripeSessionId: session.id, updatedAt: now }, { merge: true });
//   await db.doc(`events/${eventId}/orders/${orderId}`).set({ stripeSessionId: session.id, updatedAt: now }, { merge: true });

//   return { url: session.url, orderId };
// });

// /**
//  * [NEW] Handles direct Google Pay charges.
//  */
// export const gpayCharge = functions.https.onCall(async (data, context) => {
//   if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
//   const uid = context.auth.uid;

//   const { eventId, selectedTiers, promoCode, token } = data as { eventId?: string; selectedTiers?: SelectedTiers; promoCode?: string; token?: any; };
//   if (!eventId || !selectedTiers || !token) throw new functions.https.HttpsError("invalid-argument", "Missing eventId, selectedTiers, or token.");

//   const { itemsForOrder, subtotalCharged, feeBase, processingFee, total } = await _calculateOrderDetails(eventId, selectedTiers);

//   const normalizedPromo = (promoCode || "").trim().toUpperCase();
//   if (normalizedPromo === "GRIDVIP2207") throw new functions.https.HttpsError("invalid-argument", "VIP promo must use the standard checkout flow.");
//   if (total === 0) throw new functions.https.HttpsError("invalid-argument", "Free orders must use the standard checkout flow.");

//   const orderId = db.collection("_").doc().id;
//   const now = admin.firestore.FieldValue.serverTimestamp();

//   const orderDoc: any = {
//       orderId, eventId, userId: uid, items: itemsForOrder,
//       subtotal: subtotalCharged, feeBase, processingFee, total,
//       currency: "INR", promoCode: null,
//       paymentMethod: "gpay_direct",
//       status: "pending", // Start as pending
//       createdAt: now, updatedAt: now,
//   };

//   // Create pending order docs first
//   await db.doc(`users/${uid}/orders/${orderId}`).set(orderDoc);
//   await db.doc(`events/${eventId}/orders/${orderId}`).set(orderDoc);

//   let decryptedToken;
//   try {
//     const decryptor = new GooglePayDecrypt(functions.config().gpay.private_key, '', '');
//     const decryptedData = decryptor.decrypt(token) as any;
//     decryptedToken = decryptedData;
//   } catch (error) {
//       console.error("Google Pay token decryption failed:", error);
//       throw new functions.https.HttpsError("internal", "Invalid payment token.");
//   }
  
//   const { pan, expirationMonth, expirationYear } = decryptedToken;

//   try {
//       const pm = await stripe.paymentMethods.create({
//           type: "card",
//           card: { number: pan, exp_month: expirationMonth, exp_year: expirationYear },
//       });

//       const intent = await stripe.paymentIntents.create({
//           amount: Math.round(total * 100),
//           currency: "inr",
//           payment_method: pm.id,
//           confirm: true,
//           off_session: false,
//       });

//       if (intent.status === "succeeded") {
//           await db.runTransaction(async (tx) => {
//               await _fulfillOrder(tx, orderDoc);
//               // Add stripe payment intent to order
//               const orderUserRef = db.doc(`users/${uid}/orders/${orderId}`);
//               tx.set(orderUserRef, { stripePaymentIntentId: intent.id }, { merge: true });
//           });
//           return { orderId, success: true };
//       } else {
//           throw new functions.https.HttpsError("aborted", "Payment failed.", { orderId });
//       }
//   } catch (error: any) {
//       console.error("Stripe PaymentIntent failed:", error);
//       throw new functions.https.HttpsError("internal", error.message, { orderId });
//   }
// });

// /**
//  * [REFACTORED] Handles Stripe webhooks, now using the fulfillment helper.
//  */
// export const stripeWebhook = functions.https.onRequest(async (req, res) => {
//   const sig = req.headers["stripe-signature"];
//   if (!sig) {
//     res.status(400).send("Missing Stripe signature");
//     return;
//   }

//   let evt: Stripe.Event;
//   try {
//     evt = stripe.webhooks.constructEvent((req as any).rawBody, sig, functions.config().stripe.webhook_secret);
//   } catch (err: any) {
//     console.error("Webhook signature verification failed:", err.message);
//     res.status(400).send(`Webhook Error: ${err.message}`);
//     return;
//   }

//   if (evt.type === "checkout.session.completed") {
//     const session = evt.data.object as Stripe.Checkout.Session;
//     const { orderId, eventId, userId } = session.metadata || {};

//     if (!orderId || !eventId || !userId) {
//       console.warn("Webhook ignored: Missing metadata in session", session.id);
//       res.status(200).send("Missing metadata");
//       return;
//     }

//     const orderRef = db.doc(`users/${userId}/orders/${orderId}`);
//     const orderSnap = await orderRef.get();

//     if (!orderSnap.exists) {
//       console.error("Webhook failed: Order not found", orderId);
//       res.status(404).send("Order not found");
//       return;
//     }
    
//     // Use the fulfillment helper within a transaction
//     await db.runTransaction(async (tx) => {
//       await _fulfillOrder(tx, orderSnap.data() as any);
//     });
//   }

//   res.status(200).send("ok");
// });
