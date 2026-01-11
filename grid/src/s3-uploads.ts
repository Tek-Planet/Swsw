import AWS from "aws-sdk";
import * as functions from "firebase-functions/v1";
import { v4 as uuidv4 } from "uuid";

const s3 = new AWS.S3({
  region: functions.config().aws.region,
  accessKeyId: functions.config().aws.access_key_id,
  secretAccessKey: functions.config().aws.secret_access_key,
  signatureVersion: "v4",
});

const BUCKET_NAME = functions.config().aws.s3_bucket;

/**
 * [MODIFIED] Generates a pre-signed URL for securely uploading a file to S3.
 * Now supports an optional `eventId` to distinguish between event photos and profile pictures.
 */
export const generateS3UploadUrl = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to upload files."
      );
    }

    const userId = context.auth.uid;
    const { fileName, fileType, eventId } = data as {
      fileName?: string;
      fileType?: string;
      eventId?: string; // [NEW] Optional eventId parameter
    };

    if (typeof fileName !== "string" || typeof fileType !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing fileName or fileType."
      );
    }

    let s3Key: string;

    // [NEW] Conditionally construct the S3 key
    if (eventId) {
      // Path for event-specific photos
      s3Key = `events/${eventId}/photos/${uuidv4()}-${fileName}`;
    } else {
      // Default path for user profile pictures
      s3Key = `users/${userId}/profile-pictures/${uuidv4()}-${fileName}`;
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
      Expires: 60 * 5, // URL expires in 5 minutes
    };

    try {
      const uploadUrl = await s3.getSignedUrlPromise("putObject", params);

      return {
        uploadUrl,
        s3Key,
      };
    } catch (error) {
      console.error("Failed to generate pre-signed URL:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Could not generate upload URL."
      );
    }
  }
);
