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
  verifyStripePayment, // <-- Import the new function
  manuallyFulfillOrder,
  cleanupExpiredOrders,
  cancelOrder,
} from "./payments";
import {
  setAdminStatus,
  adminUploadEmailTemplates,
  seedVenueHouse6,
} from "./admin";
import { sendEventPushNotification } from "./notifications";
import { sendInvitationEmail, sendEmailToAttendees } from "./emails";
import { sendTicketEmail } from "./tickets";
import {
  onMovieEventCreated,
  holdMovieSeats,
  releaseMovieSeats,
  cleanupExpiredSeatHolds,
} from "./movies";

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
  verifyStripePayment, // <-- Export the new function
  sendInvitationEmail,
  adminUploadEmailTemplates,
  manuallyFulfillOrder,
  cleanupExpiredOrders,
  cancelOrder,
  sendTicketEmail,
  sendEmailToAttendees,
  onMovieEventCreated,
  holdMovieSeats,
  releaseMovieSeats,
  cleanupExpiredSeatHolds,
  seedVenueHouse6,
};

export const helloWorld = functions.https.onRequest((_req, res) => {
  res.send("Hello from Tekplanet API!");
});
