/**
 * This file contains the definitions for all email templates.
 * The keys in the `templates` object (e.g., "invitation") must match the
 * template name used in the Cloud Functions that trigger emails.
 */

interface EmailTemplate {
  subject: string;
  html: string;
}

export const templates: { [key: string]: EmailTemplate } = {
  invitation: {
    subject: "You're invited to {{eventName}}!",
    html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 0; background-color: #1a1a1a; }
            .container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; padding: 40px; color: #ffffff; width: 100%; max-width: 600px; margin: auto; background-color: #2a2a2a; border-radius: 10px; }
            .header { font-size: 28px; font-weight: bold; color: #ffffff; }
            .body { margin-top: 20px; font-size: 16px; line-height: 1.6; }
            .button { background-color: #007bff; color: white !important; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 12px; color: #888888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">You're Approved!</div>
            <div class="body">
              <p>Hello,</p>
              <p>Congratulations! Your application to attend <strong>{{eventName}}</strong> has been approved.</p>
              <p>You can view the event details and see who you'll be connecting with by clicking the button below:</p>
              <p style="margin: 30px 0;">
                <a href="{{link}}" class="button">View Event</a>
              </p>
              <p>We look forward to seeing you there!</p>
              <p>- The Grid Events Team</p>
            </div>
            <div class="footer">
              <p>If you did not apply for this event, please disregard this email.</p>
            </div>
          </div>
        </body>
        </html>
    `,
  },
  ticket: {
    subject: "Your ticket for {{eventName}}",
    html: `
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
            <div class="header">Your Ticket for {{eventName}}</div>
            <div class="body">
              <p>Hello,</p>
              <p>Thank you for your order. Your ticket is attached below.</p>
              <p>Please present this QR code at the event for entry.</p>
              <div class="qr-code">
                <img src="cid:qr-code-ticket" alt="QR Code" />
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
    `,
  },

  // You can add other templates here in the future, for example:
  // passwordReset: {
  //   subject: "Reset your password",
  //   html: `<h1>Click here to reset...</h1>`
  // }
};
