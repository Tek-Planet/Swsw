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
      const isMovie = afterData.orderType === "movie";
      const seatItems = Array.isArray(afterData.items)
        ? afterData.items.filter((it: any) => it && it.seatId)
        : [];
      const attendees = afterData.attendees;

      // For movie orders the tickets are per-SEAT (one QR per seat label).
      // For other orders the tickets are per-ATTENDEE (existing behaviour).
      const ticketHolders: Array<{ id: string; label: string; name?: string }> = isMovie
        ? seatItems.map((it: any, i: number) => ({
            id: `${orderId}-seat-${it.seatId}`,
            label: `Row ${it.rowLabel}, Seat ${it.seatLabel}`,
            name: attendees?.[0]?.name,
          }))
        : (attendees || []).map((a: any, i: number) => ({
            id: `${orderId}-${i}`,
            label: a.name || `Ticket ${i + 1}`,
            name: a.name,
          }));

      if (ticketHolders.length === 0) {
        functions.logger.error(`No ticket holders for order ${orderId}`);
        return;
      }

      const recipientEmail =
        attendees?.[0]?.email ||
        afterData.donor?.email ||
        afterData.tableContactDetails?.email;
      if (!recipientEmail) {
        functions.logger.error(`No recipient email for order ${orderId}`);
        return;
      }

      const attachments = [];
      for (let i = 0; i < ticketHolders.length; i++) {
        const t = ticketHolders[i];
        const qrCodeBuffer = await qrcode.toBuffer(t.id, {
          type: "png",
          width: 256,
          margin: 1,
        });
        attachments.push({
          filename: `qrcode_${(t.name || t.label).replace(/\s+/g, "_")}.png`,
          content: qrCodeBuffer.toString("base64"),
          content_id: `qr_code_ticket_${i}`,
          disposition: "attachment",
          type: "image/png",
        });
      }

      const seatListHtml = isMovie
        ? `<ul style="margin-top:12px;padding-left:18px;color:#ffffff">${ticketHolders
            .map((t) => `<li>${t.label}</li>`) 
            .join("")}</ul>`
        : "";

      const html = `
       <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #1a1a1a; }
            .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; padding: 40px; color: #ffffff; width: 100%; max-width: 600px; margin: auto; background-color: #2a2a2a; border-radius: 10px; }
            .header { font-size: 28px; font-weight: bold; color: #ffffff; }
            .body { margin-top: 20px; font-size: 16px; line-height: 1.6; color: #ffffff; }
            .footer { margin-top: 40px; font-size: 12px; color: #888888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Your Tickets for ${afterData.eventTitle}</div>
            <div class="body">
              <p>Hello,</p>
              <p>Thank you for your order. Your ticket(s) are attached. Please present the relevant QR code at the venue for entry.</p>
              ${isMovie ? `<p><strong>Your seats:</strong></p>${seatListHtml}` : ""}
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
        to: recipientEmail,
        from: "info@grideventsapp.com",
        subject: `Your tickets for ${afterData.eventTitle}`,
        html,
        attachments: attachments,
      });

      functions.logger.log(
        `Ticket email sent for order ${orderId} with ${ticketHolders.length} QR code(s).`
      );
    }
  });
