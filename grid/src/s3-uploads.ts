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
const S3_REGION = functions.config().aws.region;

/**
 * [REFACTORED] Generates a pre-signed URL for uploading and a permanent URL for viewing.
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
    const { fileName, fileType, eventId, isProfilePic } = data as {
      fileName?: string;
      fileType?: string;
      eventId?: string;
      isProfilePic?: boolean;
    };

    if (typeof fileName !== "string" || typeof fileType !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing fileName or fileType."
      );
    }

    let s3Key: string;

    if (isProfilePic) {
      s3Key = `users/${userId}/profile-picture`;
    } else if (eventId) {
      s3Key = `events/${eventId}/photos/${uuidv4()}-${fileName}`;
    } else {
      s3Key = `users/${userId}/uploads/${uuidv4()}-${fileName}`;
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
      Expires: 60 * 5, // URL expires in 5 minutes
    };

    try {
      const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
      const viewUrl = `https://${BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;

      return {
        uploadUrl,
        viewUrl,
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

/**
 * [REFACTORED] Generates batch pre-signed URLs for uploading and permanent URLs for viewing.
 */
export const adminGenerateBatchS3UploadUrls = functions.https.onCall(
  async (data, context) => {
    if (!context.auth || !context.auth.token?.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can perform batch uploads."
      );
    }

    const { files, eventId } = data as {
      files?: { fileName: string; fileType: string }[];
      eventId?: string;
    };

    if (!Array.isArray(files) || files.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "You must provide an array of files."
      );
    }

    if (files.length > 20) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "You can upload a maximum of 20 files at a time."
      );
    }

    try {
      const promises = files.map(async (file) => {
        const { fileName, fileType } = file;
        if (typeof fileName !== "string" || typeof fileType !== "string") {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "Each file must have a fileName and fileType."
          );
        }

        const s3Key = eventId
          ? `events/${eventId}/photos/${uuidv4()}-${fileName}`
          : `admin/uploads/${uuidv4()}-${fileName}`;

        const params = {
          Bucket: BUCKET_NAME,
          Key: s3Key,
          ContentType: fileType,
          Expires: 60 * 10, // 10 minutes expiry for admin uploads
        };

        const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
        const viewUrl = `https://${BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;

        return { uploadUrl, viewUrl, s3Key };
      });

      const results = await Promise.all(promises);

      return { urls: results };
    } catch (error) {
      console.error("Failed to generate batch pre-signed URLs:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Could not generate batch upload URLs."
      );
    }
  }
);
