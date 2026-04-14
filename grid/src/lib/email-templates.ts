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
            .container { font-family: sans-serif; padding: 20px; color: #333; }
            .header { font-size: 24px; font-weight: bold; color: #000; }
            .body { margin-top: 20px; font-size: 16px; line-height: 1.5; }
            .button { background-color: #007bff; color: white !important; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { margin-top: 30px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">You're Approved!</div>
            <div class="body">
              <p>Hello,</p>
              <p>Congratulations! Your application to attend <strong>{{eventName}}</strong> has been approved.</p>
              <p>You can view the event details and see who you'll be connecting with by clicking the button below:</p>
              <p style="margin: 25px 0;">
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

  // You can add other templates here in the future, for example:
  // passwordReset: {
  //   subject: "Reset your password",
  //   html: `<h1>Click here to reset...</h1>`
  // }
};
