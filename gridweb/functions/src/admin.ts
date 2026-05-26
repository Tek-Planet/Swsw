import * as functions from "firebase-functions/v1";
import { admin, db } from "./lib/firebase"; // Use the shared db instance
import { templates } from "./lib/email-templates";

/**
 * Allows an admin user to set custom claims on another user.
 */
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
    const userRoleRef = db.collection("user_roles").doc(uid); // Use shared db

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

/**
 * [ADMIN] Uploads all email templates from the code definition (`lib/email-templates.ts`)
 * to the Firestore collection used by the Trigger Email extension.
 */
export const adminUploadEmailTemplates = functions.https.onCall(
  async (_, context) => {
    // 1. Authentication: Only allow admins to run this function.
    if (!context.auth || context.auth.token.admin !== true) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "This function can only be called by an administrator."
      );
    }

    // This collection name MUST match the 'Templates collection' field in your
    // "Trigger Email" extension config. If the field is empty, it defaults to "templates".
    const templatesCollectionName = "templates";

    const batch = db.batch();
    const templatesCollection = db.collection(templatesCollectionName);
    let count = 0;

    // 2. Loop through the templates defined in the code and add them to the batch.
    for (const templateId in templates) {
      if (Object.prototype.hasOwnProperty.call(templates, templateId)) {
        const templateData = templates[templateId];
        const docRef = templatesCollection.doc(templateId);
        batch.set(docRef, templateData);
        count++;
      }
    }

    // 3. Commit the batch write to Firestore.
    await batch.commit();

    // 4. Return a success message.
    return {
      status: "success",
      message: `Successfully uploaded ${count} templates to the '${templatesCollectionName}' collection.`,
    };
  }
);

/**
 * [ADMIN] One-time seed for the partner cinema's House 6 venue.
 * This is an admin-callable function that populates the 'venues' collection.
 * It is idempotent and will overwrite the 'house6' document if it already exists.
 */
export const seedVenueHouse6 = functions.https.onCall(async (_, context) => {
  // 1. Authentication: Only allow admins to run this function.
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "This function can only be called by an administrator."
    );
  }

  // 2. Define venue configuration
  const VENUE_ID = "house6";
  const SEATS_PER_ROW = 23;
  const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const DISCOUNT_ROWS = new Set(['B', 'C']);
  const DISCOUNT_PRICE = 140;
  const STANDARD_PRICE = 160;
  const AISLE_AFTER_SEAT = 10; // Visual gap between seat 10 and 11

  // 3. Helper functions to build the venue structure
  const buildSeatsForRow = (rowLabel: string) => {
    const seats: { label: string; type: string }[] = [];
    for (let i = 1; i <= SEATS_PER_ROW; i++) {
      seats.push({ label: String(i), type: "normal" });
      if (i === AISLE_AFTER_SEAT) seats.push({ label: "", type: "aisle" });
    }
    // Add wheelchair spaces to the last row
    if (rowLabel === "L") {
      for (let w = 1; w <= 4; w++)
        seats.push({ label: `W${w}`, type: "wheelchair" });
    }
    return seats;
  };

  const buildRows = () => {
    return ROW_LABELS.map((label) => ({
      label,
      price: DISCOUNT_ROWS.has(label) ? DISCOUNT_PRICE : STANDARD_PRICE,
      seats: buildSeatsForRow(label),
    }));
  };

  // 4. Construct the final venue object
  const venue = {
    name: "House 6 — Premiere Elements",
    hallName: "House 6",
    screenPosition: "top",
    currency: "HKD",
    rows: buildRows(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    // 5. Write the object to Firestore
    await db.collection("venues").doc(VENUE_ID).set(venue);

    const seatCount = venue.rows.reduce(
      (n, r) => n + r.seats.filter((s) => s.type !== "aisle").length,
      0
    );

    // 6. Return a success response
    return {
      status: "success",
      message: `Successfully seeded venues/${VENUE_ID}: ${seatCount} bookable seats across ${venue.rows.length} rows.`,
    };
  } catch (error) {
    console.error("Venue seed failed:", error);
    // 7. Return an error response
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while seeding the venue."
    );
  }
});
