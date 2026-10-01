import * as functions from "firebase-functions/v1";
import { db } from "./lib/firebase";

export const sendWhatsAppBroadcastToAttendees = functions.https.onCall(
  async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called by an authenticated admin."
      );
    }

    const { eventId, message, recipientFilter = "all" } = data;

    if (!eventId || !message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: eventId and message."
      );
    }

    try {
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Event not found.");
      }

      // Query bookings for this event
      const bookingsSnapshot = await db
        .collection("bookings")
        .where("eventId", "==", eventId)
        .where("paymentStatus", "==", "completed")
        .get();

      if (bookingsSnapshot.empty) {
        return {
          success: true,
          recipientCount: 0,
          message: "No completed bookings found for this event.",
        };
      }

      const attendees: { phone: string; name: string }[] = [];
      bookingsSnapshot.forEach((doc) => {
        const bData = doc.data();
        const phone = bData.phone || bData.attendeePhone || bData.userPhone;
        const name = bData.userName || bData.attendeeName || bData.name || "Attendee";
        const checkedIn = !!bData.checkedIn;

        if (recipientFilter === "checked_in" && !checkedIn) return;
        if (recipientFilter === "not_checked_in" && checkedIn) return;

        if (phone) {
          attendees.push({ phone, name });
        }
      });

      // Log broadcast in Firestore
      const broadcastRef = await db.collection("event_whatsapp_broadcasts").add({
        eventId,
        message,
        recipientCount: attendees.length,
        recipientFilter,
        status: "completed",
        sentAt: new Date(),
        sentBy: context.auth.uid,
      });

      return {
        success: true,
        broadcastId: broadcastRef.id,
        recipientCount: attendees.length,
        attendees,
      };
    } catch (error: any) {
      functions.logger.error("Error in sendWhatsAppBroadcastToAttendees:", error);
      throw new functions.https.HttpsError(
        "internal",
        error.message || "An unexpected error occurred."
      );
    }
  }
);
