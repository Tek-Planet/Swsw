import * as functions from "firebase-functions/v1";

import { processSurveyAndFindMatches } from "./matching";
import {
  indexUserProfilePicture,
  adminRunEventFaceRecognition,
} from "./face-recognition";
import {
  generateS3UploadUrl,
  adminGenerateBatchS3UploadUrls,
} from "./s3-uploads";
import {
  createPaymentIntent,
  updateOrderContactDetails,
  createCheckoutSession,
  gpayCharge,
  stripeWebhook,
  createRazorpayOrder,
  razorpayWebhook,
  verifyRazorpayPayment,
} from "./payments";
import { setAdminStatus, adminUploadEmailTemplates } from "./admin"; // Import the new function
import { sendEventPushNotification } from "./notifications";
import { sendInvitationEmail } from "./emails";

export {
  processSurveyAndFindMatches,
  indexUserProfilePicture,
  adminRunEventFaceRecognition,
  generateS3UploadUrl,
  adminGenerateBatchS3UploadUrls,
  createPaymentIntent,
  updateOrderContactDetails,
  createCheckoutSession,
  gpayCharge,
  stripeWebhook,
  setAdminStatus,
  sendEventPushNotification,
  createRazorpayOrder,
  razorpayWebhook,
  verifyRazorpayPayment,
  sendInvitationEmail,
  adminUploadEmailTemplates, // Export the new function
};

export const helloWorld = functions.https.onRequest((_req, res) => {
  res.send("Hello from Tekplanet API!");
});
