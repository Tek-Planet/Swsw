/**
 * Movie / cinema-seat cloud functions.
 *
 * Phase 1 scope (confirmed with partner):
 *  - Single venue: venues/house6
 *  - Row-based pricing (B,C = 140 HKD; others = 160 HKD)
 *  - 8-min seat-hold TTL
 *  - Max 10 seats per order
 *  - Wheelchair seats bookable as normal seats
 *
 * What this module owns:
 *   onMovieEventCreated  - generates events/{id}/seats/* from the chosen venue layout
 *   holdMovieSeats       - transactional 8-min hold for the current user
 *   releaseMovieSeats    - voluntary release of a user's holds (e.g. they backed out)
 *   cleanupExpiredSeatHolds - scheduled sweep every 2 min
 *   fulfilMovieSeatsForOrder - shared helper called from Stripe webhook on success
 */
import * as functions from "firebase-functions/v1";
import { admin, db } from "./lib/firebase";

const MAX_SEATS_PER_ORDER = 10;
const HOLD_TTL_MINUTES = 8;

interface VenueSeat {
  label: string;
  type: "normal" | "wheelchair" | "blocked" | "aisle";
}
interface VenueRow {
  label: string;
  price: number;
  seats: VenueSeat[];
}

function seatId(rowLabel: string, seatLabel: string) {
  return `${rowLabel}-${seatLabel}`;
}

/**
 * When a movie event is created (eventType === 'movie' && venueId set),
 * generate the per-seat docs under events/{eventId}/seats/*.
 * Idempotent: skips creation if seats already exist.
 */
export const onMovieEventCreated = functions.firestore
  .document("events/{eventId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    if (data.eventType !== "movie" || !data.venueId) return null;

    const eventId = context.params.eventId as string;
    const seatsCol = db.collection("events").doc(eventId).collection("seats");

    // Idempotency guard
    const existing = await seatsCol.limit(1).get();
    if (!existing.empty) {
      functions.logger.info(`Seats already exist for ${eventId}, skipping.`);
      return null;
    }

    const venueSnap = await db.collection("venues").doc(data.venueId).get();
    if (!venueSnap.exists) {
      functions.logger.error(`Venue ${data.venueId} not found for event ${eventId}`);
      return null;
    }
    const venue = venueSnap.data() as { rows: VenueRow[] };

    const batch = db.batch();
    let count = 0;
    for (const row of venue.rows || []) {
      for (const vs of row.seats || []) {
        if (vs.type === "aisle") continue;
        const id = seatId(row.label, vs.label);
        batch.set(seatsCol.doc(id), {
          id,
          rowLabel: row.label,
          seatLabel: vs.label,
          type: vs.type === "wheelchair" ? "wheelchair" : "normal",
          price: row.price,
          status: vs.type === "blocked" ? "blocked" : "available",
          heldBy: null,
          heldUntil: null,
          orderId: null,
          userId: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
        // Firestore batch limit is 500
        if (count % 450 === 0) {
          await batch.commit();
        }
      }
    }
    await batch.commit();
    functions.logger.info(`Seeded ${count} seats for event ${eventId}.`);
    return null;
  });

/**
 * Holds the requested seats for the current user for 8 minutes.
 * Returns the price summary so the client can confirm before paying.
 */
export const holdMovieSeats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }
  const userId = context.auth.uid;
  const { eventId, seatIds } = data as { eventId?: string; seatIds?: string[] };

  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "eventId and seatIds required."
    );
  }
  if (seatIds.length > MAX_SEATS_PER_ORDER) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Maximum ${MAX_SEATS_PER_ORDER} seats per order.`
    );
  }

  const seatsCol = db.collection("events").doc(eventId).collection("seats");
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + HOLD_TTL_MINUTES * 60 * 1000
  );

  const heldSummaries = await db.runTransaction(async (tx) => {
    const refs = seatIds.map((id) => seatsCol.doc(id));
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));

    const summaries: Array<{ id: string; price: number; rowLabel: string; seatLabel: string }> = [];

    for (let i = 0; i < snaps.length; i++) {
      const s = snaps[i];
      const id = seatIds[i];
      if (!s.exists) {
        throw new functions.https.HttpsError("not-found", `Seat ${id} not found.`);
      }
      const seat = s.data() as any;
      const isMine = seat.heldBy === userId;
      const expired =
        seat.heldUntil && seat.heldUntil.toMillis && seat.heldUntil.toMillis() < now.toMillis();
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
      tx.update(refs[i], {
        status: "held",
        heldBy: userId,
        heldUntil: expiresAt,
        orderId: null,
        updatedAt: now,
      });
      summaries.push({
        id,
        price: Number(seat.price ?? 0),
        rowLabel: seat.rowLabel,
        seatLabel: seat.seatLabel,
      });
    }
    return summaries;
  });

  const subtotal = heldSummaries.reduce((n, s) => n + s.price, 0);
  return {
    success: true,
    holdExpiresAt: expiresAt.toMillis(),
    seats: heldSummaries,
    subtotal,
  };
});

/**
 * Voluntarily release the user's holds on the given seats (no payment).
 */
export const releaseMovieSeats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }
  const userId = context.auth.uid;
  const { eventId, seatIds } = data as { eventId?: string; seatIds?: string[] };
  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return { success: true, released: 0 };
  }

  const seatsCol = db.collection("events").doc(eventId).collection("seats");
  let released = 0;
  await db.runTransaction(async (tx) => {
    const refs = seatIds.map((id) => seatsCol.doc(id));
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));
    snaps.forEach((s, i) => {
      if (!s.exists) return;
      const d = s.data() as any;
      if (d.status === "held" && d.heldBy === userId) {
        tx.update(refs[i], {
          status: "available",
          heldBy: null,
          heldUntil: null,
          orderId: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        released++;
      }
    });
  });
  return { success: true, released };
});

/**
 * Shared fulfilment used by Stripe webhook to mark held seats sold for an order.
 * Safe to call multiple times (idempotent — sold seats stay sold).
 * NOW ALSO UPDATES THE MASTER EVENT DOC WITH SOLD SEAT IDs.
 */
export async function fulfilMovieSeatsForOrder(params: {
  eventId: string;
  userId: string;
  orderId: string;
  seatIds: string[];
}) {
  const { eventId, userId, orderId, seatIds } = params;
  if (!seatIds || seatIds.length === 0) return;

  const eventRef = db.collection("events").doc(eventId); // Get ref to the main event
  const seatsCol = eventRef.collection("seats");

  await db.runTransaction(async (tx) => {
    // 1. Update individual seat documents to "sold"
    const refs = seatIds.map((id) => seatsCol.doc(id));
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));
    snaps.forEach((s, i) => {
      if (!s.exists) return; // Seat doc should always exist
      const d = s.data() as any;
      if (d.status === "sold" && d.orderId === orderId) return; // Idempotency check
      
      tx.update(refs[i], {
        status: "sold",
        userId,
        orderId,
        heldUntil: null, // Clear hold data
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // 2. Atomically add the sold seats to the main event document
    // Using arrayUnion is atomic and prevents duplicates.
    tx.update(eventRef, {
      soldSeatIds: admin.firestore.FieldValue.arrayUnion(...seatIds),
    });
  });
}

/**
 * Scheduled sweep every 2 minutes: release any expired seat holds back to available.
 */
export const cleanupExpiredSeatHolds = functions.pubsub
  .schedule("every 2 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db
      .collectionGroup("seats")
      .where("status", "==", "held")
      .where("heldUntil", "<", now)
      .limit(400)
      .get();

    if (snap.empty) return null;

    const batch = db.batch();
    snap.forEach((d) => {
      batch.update(d.ref, {
        status: "available",
        heldBy: null,
        heldUntil: null,
        orderId: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    functions.logger.info(`Released ${snap.size} expired seat holds.`);
    return null;
  });
