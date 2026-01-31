import * as functions from "firebase-functions/v1";
import { admin } from "./lib/firebase";

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
