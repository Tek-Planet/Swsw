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
} from "./payments";
import { setAdminStatus } from "./admin";
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
  sendInvitationEmail,
};

export const helloWorld = functions.https.onRequest((_req, res) => {
  res.send("Hello from Tekplanet API!");
});
