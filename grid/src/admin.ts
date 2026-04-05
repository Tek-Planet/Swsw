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
