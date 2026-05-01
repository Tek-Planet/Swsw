import * as functions from "firebase-functions/v1";
import { db } from "./lib/firebase"; // Correctly import the shared db instance

// This function sends an email when an event application is approved.
export const sendInvitationEmail = functions.firestore
  .document("/events/{eventId}/applications/{appId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if the status was changed from something else to 'approved'.
    if (beforeData.status !== "approved" && afterData.status === "approved") {
      functions.logger.log(
        `Application ${context.params.appId} approved. Sending email.`
      );

      const userEmail = afterData.email;
      const eventId = context.params.eventId;

      if (!userEmail) {
        functions.logger.error("Application data is missing the user's email.");
        return;
      }

      // Get the event details to include in the email.
      const eventDoc = await db.collection("events").doc(eventId).get();
      const eventName = eventDoc.data()?.title || "the event";

      const appUrl = functions.config().app.url;
      if (!appUrl) {
        functions.logger.error("App URL is not configured.");
        return;
      }
      const eventLink = `${appUrl}/events/${eventId}`;

      // Create an email document in the 'mail' collection.
      // The 'Trigger Email' extension will pick this up and send the email.
      const mailData = {
        to: userEmail,
        template: {
          name: "invitation", // Make sure you have a template with this name.
          data: {
            eventName: eventName,
            link: eventLink,
          },
        },
      };

      await db.collection("mail").add(mailData);

      functions.logger.log(`Email document created for ${userEmail}.`);
    }
  });
