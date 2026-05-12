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
      const attendees = afterData.attendees;

      if (!attendees || attendees.length === 0) {
        functions.logger.error(`No attendees found for order ${orderId}`);
        return;
      }

      const attachments = [];
      let qrCodesHtml = "";

      for (let i = 0; i < attendees.length; i++) {
        const attendee = attendees[i];
        // Create a unique ID for each ticket's QR code
        const ticketId = `${orderId}-${i}`;

        const qrCodeBuffer = await qrcode.toBuffer(ticketId, {
          type: "png",
          width: 256,
          margin: 1,
        });

        const qrCodeBase64 = qrCodeBuffer.toString("base64");
        const contentId = `qr_code_ticket_${i}`;

        attachments.push({
          filename: `qrcode_${attendee.name || i}.png`,
          content: qrCodeBase64,
          content_id: contentId, // Use 'content_id' for inline images
          disposition: "attachment",
          type: "image/png",
        });

        qrCodesHtml += `
          <div style="margin-bottom: 25px; text-align: center;">
              <p style="margin-top: 10px; font-weight: bold; color: #ffffff;">${
                attendee.name || `Ticket ${i + 1}`
              }</p>
              <img src="cid:${contentId}" alt="QR Code for ${
          attendee.name || `Ticket ${i + 1}`
        }" style="border-radius: 10px;" />
          </div>
        `;
      }

      const html = `
       <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #1a1a1a; }
            .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; padding: 40px; color: #ffffff; width: 100%; max-width: 600px; margin: auto; background-color: #2a2a2a; border-radius: 10px; }
            .header { font-size: 28px; font-weight: bold; color: #ffffff; }
            .body { margin-top: 20px; font-size: 16px; line-height: 1.6; color: #ffffff; }
            .qr-code-section { margin-top: 20px; text-align: center; }
            .footer { margin-top: 40px; font-size: 12px; color: #888888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Your Tickets for ${afterData.eventTitle}</div>
            <div class="body">
              <p>Hello,</p>
              <p>Thank you for your order. Your ticket(s) are below. Please present the relevant QR code at the event for entry.</p>
              <div class="qr-code-section">
                ${qrCodesHtml}
              </div>
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
        from: "info@grideventsapp.com",
        subject: `Your tickets for ${afterData.eventTitle}`,
        html,
        attachments: attachments,
      });

      functions.logger.log(
        `Ticket email sent for order ${orderId} with ${attendees.length} QR code(s).`
      );
    }
  });
