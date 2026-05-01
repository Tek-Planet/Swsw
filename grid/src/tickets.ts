import * as functions from "firebase-functions/v1";
import * as qrcode from "qrcode";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(functions.config().sendgrid.apikey);

export const sendTicketEmail = functions.firestore
  .document("/orders/{orderId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (beforeData.status !== "paid" && afterData.status === "paid") {
      const orderId = context.params.orderId;

      // Generate QR code
      const qrCodeBuffer = await qrcode.toBuffer(orderId, {
        type: "png",
        width: 256,
        margin: 1,
      });

      const qrCodeBase64 = qrCodeBuffer.toString("base64");

      const html = `
       <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #1a1a1a; }
            .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; padding: 40px; color: #ffffff; width: 100%; max-width: 600px; margin: auto; background-color: #2a2a2a; border-radius: 10px; }
            .header { font-size: 28px; font-weight: bold; color: #ffffff; }
            .body { margin-top: 20px; font-size: 16px; line-height: 1.6; }
            .qr-code { margin-top: 20px; text-align: center; }
            .qr-code img { border-radius: 10px; }
            .footer { margin-top: 40px; font-size: 12px; color: #888888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Your Ticket for ${afterData.eventTitle}</div>
            <div class="body">
              <p>Hello,</p>
              <p>Thank you for your order. Your ticket is attached below.</p>
              <p>Please present this QR code at the event for entry.</p>
              <p>We look forward to seeing you there!</p>
              <p>- The Grid Events Team</p>
            </div>
            <div class="footer">
              <p>If you did not purchase a ticket for this event, please disregard this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sgMail.send({
        to: afterData.attendees[0].email,
        from: "info@grideventsapp.com", // use a verified sender
        subject: `Your ticket for ${afterData.eventTitle}`,
        html,
        attachments: [
          {
            filename: "qrcode.png",
            content: qrCodeBase64,
            type: "image/png",
            disposition: "attachment",
          },
        ],
      });

      functions.logger.log(`Ticket email sent for order ${orderId}`);
    }
  });
