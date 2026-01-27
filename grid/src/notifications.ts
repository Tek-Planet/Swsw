import * as functions from "firebase-functions/v1";
import { admin, db } from "./lib/firebase";

const messaging = admin.messaging();

/**
 * Cloud Function that triggers when a new document is created in the
 * `event_notifications` collection. It sends a push notification to all
 * users who have purchased a ticket for that event.
 */
export const sendEventPushNotification = functions.firestore
  .document("event_notifications/{notificationId}")
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot) => {
    const notificationData = snapshot.data();

    // Ensure the notification data exists
    if (!notificationData) {
      console.log("No data associated with the notification.");
      return;
    }

    const { eventId, message, title } = notificationData;
    console.log(`New notification created for event: ${eventId}`);

    try {
      // Step 1: Find all users who have a paid order for the event.
      const ordersSnapshot = await db
        .collection("orders")
        .where("eventId", "==", eventId)
        .where("status", "==", "paid")
        .get();

      if (ordersSnapshot.empty) {
        console.log("No paid orders found for this event. No notifications will be sent.");
        return;
      }

      // Step 2: Collect the unique IDs of all attendees.
      const userIds = new Set<string>();
      ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        if (order.userId) {
          userIds.add(order.userId);
        }
      });

      console.log(`Found ${userIds.size} unique users to notify.`);

      // Step 3: Gather all the FCM tokens for these users.
      const tokens: string[] = [];
      const tokenPromises = Array.from(userIds).map(async (userId) => {
        const tokensSnapshot = await db.collection(`users/${userId}/fcmTokens`).get();
        tokensSnapshot.forEach((tokenDoc) => {
          const tokenData = tokenDoc.data();
          if (tokenData.token) {
            tokens.push(tokenData.token);
          }
        });
      });

      // Wait for all token fetches to complete.
      await Promise.all(tokenPromises);

      if (tokens.length === 0) {
        console.log("No FCM tokens found for any of the users.");
        return;
      }

      console.log(`Attempting to send notifications to ${tokens.length} device tokens.`);

      // Step 4: Construct and send the push notification payload.
      const payload = {
        notification: {
          title: title || "New Event Announcement",
          body: message,
        },
        webpush: {
          notification: {
            icon: "https://your-app-url.com/notification-icon.png",
          },
          fcmOptions: {
            link: `https://your-app-url.com/events/${eventId}`,
          },
        },
      } as admin.messaging.MessagingPayload;

      // Send the message to all collected device tokens.
      const response = await messaging.sendToDevice(tokens, payload);
      console.log("Successfully sent messages:", response.successCount);
      console.log("Failed messages:", response.failureCount);


      // Step 5 (Recommended): Clean up invalid or outdated FCM tokens.
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          console.error(
            "Failure sending notification to token:",
            tokens[index],
            error
          );
          if (
            error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered"
          ) {
            console.log(`Consider deleting this invalid token: ${tokens[index]}`);
          }
        }
      });

    } catch (error) {
      console.error("Error sending push notifications:", error);
    }
  });
