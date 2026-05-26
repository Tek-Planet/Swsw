import * as functions from "firebase-functions/v1";
import { db } from "./lib/firebase";
import { templates } from "./lib/email-templates";
import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = functions.config().sendgrid?.apikey;
if (!SENDGRID_API_KEY) {
  functions.logger.error("FATAL: SendGrid API key is not configured.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

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

      const template = templates.invitation;
      const subject = template.subject.replace("{{eventName}}", eventName);
      let html = template.html.replace("{{eventName}}", eventName);
      html = html.replace("{{link}}", eventLink);

      // Create an email document in the 'mail' collection.
      // The 'Trigger Email' extension will pick this up and send the email.
      const mailData = {
        to: userEmail,
        message: {
          subject: subject,
          html: html,
        },
      };

      await db.collection("mail").add(mailData);

      functions.logger.log(`Email document created for ${userEmail}.`);
    }
  });

export const sendEmailToAttendees = functions.https.onCall(
  async (data, context) => {
    if (!SENDGRID_API_KEY) {
      functions.logger.error(
        "Attempted to call sendEmailToAttendees without SendGrid API key."
      );
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The email service is not configured."
      );
    }

    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called by an authenticated admin."
      );
    }

    const { eventId, subject, htmlBody } = data;

    if (!eventId || !subject || !htmlBody) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: eventId, subject, and htmlBody."
      );
    }

    try {
      const eventDoc = await db.collection("events").doc(eventId).get();
      if (!eventDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Event not found.");
      }
      const eventName = eventDoc.data()?.title || "the event";

      const attendeesSnapshot = await db
        .collection("events")
        .doc(eventId)
        .collection("attendees")
        .get();

      if (attendeesSnapshot.empty) {
        return { success: true, message: "No paid attendees to email." };
      }

      const attendeeEmails = new Set<string>();
      attendeesSnapshot.forEach((doc) => {
        const attendee = doc.data();
        if (attendee.email) {
          attendeeEmails.add(attendee.email);
        }
      });

      if (attendeeEmails.size === 0) {
        return { success: true, message: "No attendees with emails found." };
      }

      const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; padding: 0; background-color: #1a1a1a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
              .container { width: 100%; max-width: 600px; margin: auto; background-color: #2a2a2a; border-radius: 10px; padding: 40px; }
              .header { font-size: 28px; font-weight: bold; color: #ffffff; }
              .body { margin-top: 20px; font-size: 16px; line-height: 1.6; white-space: pre-wrap; color: #ffffff; }
              .footer { margin-top: 40px; font-size: 12px; color: #888888; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">An Update Regarding ${eventName}</div>
              <div class="body">
                ${htmlBody}
                <p><br>- The ${eventName} Team</p>
              </div>
              <div class="footer">
                <p>You are receiving this email because you have a ticket for this event.</p>
              </div>
            </div>
          </body>
          </html>
        `;

      const personalizations = Array.from(attendeeEmails).map((email) => ({
        to: [{ email }],
      }));

      const msg = {
        personalizations,
        from: {
          email: "info@grideventsapp.com",
          name: `The ${eventName} Team`,
        },
        subject: subject, // Use the subject passed from the client directly
        html: emailHtml,
        categories: ["event-announcement", `event-${eventId}`],
      };

      await sgMail.send(msg);

      functions.logger.log(
        `Email campaign for event ${eventId} sent to ${attendeeEmails.size} attendees.`
      );

      return {
        success: true,
        message: `Emails sent to ${attendeeEmails.size} attendees.`,
      };
    } catch (error) {
      functions.logger.error(
        `Error sending email for event ${eventId}:`,
        error
      );
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while sending the emails."
      );
    }
  }
);
