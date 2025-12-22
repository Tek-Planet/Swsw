import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin/app";
import type { FirestoreTicketTier } from "../types/event";
import serviceAccount from "./serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const db = admin.firestore();

/**
 * 1. EVENT SEED DATA
 * Replace this object with your event JSON.
 */
const EVENT_DATA = {
  attendeeIds: [],
  attendeesCount: 0,
  coverImageUrl:
    "https://firebasestorage.googleapis.com/v0/b/tekplanet-c25f6.firebasestorage.app/o/images%2Fevents%2FhIn7DP1V5XeuwIO09QUQ%2Falbums%2Fr5T2FN2E6dG08xe5RiHs%2Fphotos%2F1765921143943.jpg%2Fgrid%20event%20thumbnail.png?alt=media&token=195b05e8-b2c0-4a75-b9bd-77fcb9765029",
  description: `About This Event

Join us for Bangalore’s hottest night out - the Grid Launch at Cavore by Sourberry ft. DJ Chetas!!! With an illustrious guestlist (you’ll be in close proximity to partying with celebrities, athletes, VVIPs), this is the party you don’t want to miss.

Make Grid your new best friend - download the App, book your tickets, and we’ll see you for a night you’ll never forget!

Note: EVERYONE who books through Grid receives special perks - not only do we have discounts, we also have special surprises ;)

hint: free drinks? 🍸`,
  endTime: new Date("2025-12-28T01:00:00.925Z"),
  hostId: "another-friend-456",
  hostName: "Grid Team",
  likesCount: 0,
  location: { city: "Cavore by Sourberry", type: "physical" },
  popularityScore: 0,
  startTime: new Date("2025-12-27T15:00:00.008Z"),
  status: "published",
  subtitle: "Grid - Launch Event in Bangalore!",
  tags: ["sport", "gaming", "party"],
  title: "GRID LAUNCH PARTY at Cavore ft. DJ Chetas",
  visibility: "public",
};

/**
 * 2. TICKET TIERS
 */
const TIER_DOC_IDS = {
  LADIES_FREE: "ladies_free",
  STAG: "stag",
  COUPLES: "couples",
  TABLE_SILVER: "table_silver",
  TABLE_GOLD: "table_gold",
  TABLE_PLATINUM: "table_platinum",
  PHOTO_ACCESS: "photo_access",
} as const;

type TierSeed = Omit<FirestoreTicketTier, "createdAt" | "updatedAt"> & { id: string };

const ticketTiers: TierSeed[] = [
  { id: TIER_DOC_IDS.LADIES_FREE, name: "Ladies (Free)", price: 0, currency: "INR", type: "ticket", isActive: true, quantitySold: 0, sortOrder: 1 },
  { id: TIER_DOC_IDS.STAG, name: "Stag", price: 8000, currency: "INR", type: "ticket", isActive: true, quantitySold: 0, sortOrder: 2 },
  { id: TIER_DOC_IDS.COUPLES, name: "Couples", price: 5000, currency: "INR", type: "ticket", isActive: true, quantitySold: 0, sortOrder: 3 },

  { id: TIER_DOC_IDS.TABLE_SILVER, name: "Table - Silver (Guaranteed lowest rates)", price: 90000, currency: "INR", type: "table", isActive: true, quantitySold: 0, sortOrder: 4 },
  { id: TIER_DOC_IDS.TABLE_GOLD, name: "Table - Gold (Guaranteed lowest rates)", price: 180000, currency: "INR", type: "table", isActive: true, quantitySold: 0, sortOrder: 5 },
  { id: TIER_DOC_IDS.TABLE_PLATINUM, name: "Table - Platinum (Guaranteed lowest rates)", price: 450000, currency: "INR", type: "table", isActive: true, quantitySold: 0, sortOrder: 6 },

  { id: TIER_DOC_IDS.PHOTO_ACCESS, name: "Event photos access", price: 500, currency: "INR", type: "addon", isActive: true, quantitySold: 0, sortOrder: 7 },
];

/**
 * 3. CREATE EVENT FIRST
 */
const createEvent = async () => {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const eventRef = db.collection("events").doc(); // auto ID
  const eventId = eventRef.id;

  await eventRef.set({
    ...EVENT_DATA,
    id: eventId,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`✅ Event created with ID: ${eventId}`);
  return eventId;
};

/**
 * 4. SEED TICKET TIERS
 */
const seedTicketTiers = async (eventId: string) => {
  console.log(`Seeding ticket tiers for event: ${eventId}`);

  const ticketTiersCollection = db.collection("events").doc(eventId).collection("ticketTiers");
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const tier of ticketTiers) {
    const { id, ...tierData } = tier;
    const tierRef = ticketTiersCollection.doc(id);

    batch.set(
      tierRef,
      { ...tierData, createdAt: now, updatedAt: now },
      { merge: true }
    );
  }

  await batch.commit();
  console.log(`✅ Seeded ${ticketTiers.length} ticket tiers.`);
};

/**
 * 5. SEED PROMO CODE
 */
const seedPromoCode = async (eventId: string) => {
  console.log(`Seeding promo code for event: ${eventId}`);

  const promoRef = db.collection("promoCodes").doc("GRIDVIP2207");
  const now = admin.firestore.FieldValue.serverTimestamp();

  await promoRef.set(
    {
      code: "GRIDVIP2207",
      isActive: true,
      maxRedemptions: 1000,
      redeemedCount: 0,
      eventId,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  console.log(`✅ Promo code GRIDVIP2207 seeded.`);
};

/**
 * 6. RUN EVERYTHING IN ORDER
 */
const run = async () => {
  try {
    const eventId = await createEvent();
    await seedTicketTiers(eventId);
    await seedPromoCode(eventId);

    console.log("🎉 ALL DONE!");
    console.log(`👉 Event ID: ${eventId}`);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

run();
