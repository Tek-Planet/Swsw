import * as functions from "firebase-functions/v1";
import { admin, db } from "./lib/firebase";

const messaging = admin.messaging();

/**
 * Cloud Function that triggers when a new document is created in the
 * `event_notifications` collection. It sends a push notification AND an
 * in-app notification to all users who have purchased a ticket for that event.
 */
export const sendEventPushNotification = functions.firestore
  .document("event_notifications/{notificationId}")
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot) => {
    const notificationData = snapshot.data();

    if (!notificationData) {
      console.log("No data associated with the notification.");
      return;
    }

    const { eventId, message, title } = notificationData;
    console.log(`New notification created for event: ${eventId}`);

    try {
      const ordersSnapshot = await db
        .collection("orders")
        .where("eventId", "==", eventId)
        .where("status", "==", "paid")
        .get();

      if (ordersSnapshot.empty) {
        console.log(
          "No paid orders found for this event. No notifications will be sent."
        );
        return;
      }

      const userIds = new Set<string>();
      ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        if (order.userId) {
          userIds.add(order.userId);
        }
      });

      console.log(`Found ${userIds.size} unique users to notify.`);
      if (userIds.size === 0) return;

      const inAppPayload = {
        title: `📢 ${title || "Event Update"}`,
        message,
        link: `/events/${eventId}`,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        icon: "calendar",
      };

      const inAppBatch = db.batch();
      userIds.forEach((userId) => {
        const userNotificationRef = db
          .collection("notifications")
          .doc(userId)
          .collection("user_notifications")
          .doc();
        inAppBatch.set(userNotificationRef, inAppPayload);
      });

      const tokens: string[] = [];
      const tokenPromises = Array.from(userIds).map(async (userId) => {
        const tokensSnapshot = await db
          .collection(`users/${userId}/fcmTokens`)
          .get();
        tokensSnapshot.forEach((tokenDoc) => {
          const tokenData = tokenDoc.data();
          if (tokenData.token) {
            tokens.push(tokenData.token);
          }
        });
      });

      await Promise.all(tokenPromises);

      await inAppBatch.commit();
      console.log(`Successfully created ${userIds.size} in-app notifications.`);

      if (tokens.length > 0) {
        console.log(
          `Attempting to send push notifications to ${tokens.length} device tokens.`
        );

        console.log(tokens);

        // The link is now a relative path to prevent FCM from trying to validate it.
        const pushPayload = {
          notification: {
            title: title || "New Event Announcement",
            body: message,
          },
          // data: {
          //   link: `/events/${eventId}`,
          // },
        };

        console.log(pushPayload, "Payload");

        const response = await messaging.sendToDevice(
          tokens,
          pushPayload as any
        );
        console.log("Successfully sent push messages:", response.successCount);
        console.log("Failed push messages:", response.failureCount);

        response.results.forEach((result, index) => {
          if (result.error) {
            console.error(
              "Failure sending to token:",
              tokens[index],
              result.error
            );
          }
        });
      } else {
        console.log(
          "No FCM tokens found for any of the users. Skipping push notifications."
        );
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  });
