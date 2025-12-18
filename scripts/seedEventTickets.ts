import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin/app";
import type { FirestoreTicketTier, TicketTierType } from "../types/event";
import serviceAccount from "./serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const db = admin.firestore();

// ✅ Set your eventId here
const eventId = "hIn7DP1V5XeuwIO09QUQ";

/**
 * Deterministic IDs so re-running script updates instead of duplicating.
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
  // Tickets
  {
    id: TIER_DOC_IDS.LADIES_FREE,
    name: "Ladies (Free)",
    price: 0,
    currency: "INR",
    type: "ticket" as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 1,
  },
  {
    id: TIER_DOC_IDS.STAG,
    name: "Stag",
    price: 8000,
    currency: "INR",
    type: "ticket" as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 2,
  },
  {
    id: TIER_DOC_IDS.COUPLES,
    name: "Couples",
    price: 5000,
    currency: "INR",
    type: "ticket" as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 3,
  },

  // Tables
  {
    id: TIER_DOC_IDS.TABLE_SILVER,
    name: "Table - Silver (Guaranteed lowest rates)",
    price: 90000,
    currency: "INR",
    type: "table" as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 4,
  },
  {
    id: TIER_DOC_IDS.TABLE_GOLD,
    name: "Table - Gold (Guaranteed lowest rates)",
    price: 180000,
    currency: "INR",
    type: "table" as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 5,
  },
  {
    id: TIER_DOC_IDS.TABLE_PLATINUM,
    name: "Table - Platinum (Guaranteed lowest rates)",
    price: 450000,
    currency: "INR",
    type: "table" as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 6,
  },

  // Add-ons (keep if still selling photo access)
  {
    id: TIER_DOC_IDS.PHOTO_ACCESS,
    name: "Event photos access",
    price: 500,
    currency: "INR",
    type: "addon" as TicketTierType,
    isActive: true,
    quantitySold: 0,
    sortOrder: 7,
  },
];

const seedTicketTiers = async () => {
  console.log(`Seeding ticket tiers for event: ${eventId}`);

  const ticketTiersCollection = db.collection("events").doc(eventId).collection("ticketTiers");
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const tier of ticketTiers) {
    const { id, ...tierData } = tier;

    // deterministic doc id so re-run does update instead of duplicate
    const tierRef = ticketTiersCollection.doc(id);

    batch.set(
      tierRef,
      {
        ...tierData,
        createdAt: now, // if already exists, this will overwrite; optional tweak below
        updatedAt: now,
      },
      { merge: true }
    );
  }

  await batch.commit();
  console.log(`✅ Seeded/updated ${ticketTiers.length} ticket tiers for event ${eventId}.`);
};

const seedPromoCodeGRIDVIP = async () => {
  console.log(`Seeding promo code: GRIDVIP`);
  const promoRef = db.collection("promoCodes").doc("GRIDVIP");
  const now = admin.firestore.FieldValue.serverTimestamp();

  await promoRef.set(
    {
      code: "GRIDVIP",
      isActive: true,
      // You can tune these:
      maxRedemptions: 1000,
      redeemedCount: 0,
      // Optional: restrict to this event only:
      eventId,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  console.log(`✅ Promo code GRIDVIP seeded/updated.`);
};

const run = async () => {
  await seedTicketTiers();
  await seedPromoCodeGRIDVIP();
  console.log("✅ All seeding completed.");
};

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
