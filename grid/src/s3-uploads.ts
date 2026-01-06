
import * as functions from 'firebase-functions/v1';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  region: functions.config().aws.region,
  accessKeyId: functions.config().aws.access_key_id,
  secretAccessKey: functions.config().aws.secret_access_key,
  signatureVersion: 'v4',
});

const BUCKET_NAME = functions.config().aws.s3_bucket;

/**
 * [NEW] Generates a pre-signed URL for securely uploading a file to S3.
 * This function is callable from the client-side to initiate an upload.
 */
export const generateS3UploadUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to upload files.');
  }

  const userId = context.auth.uid;
  const { fileName, fileType } = data as { fileName?: string; fileType?: string };

  if (typeof fileName !== 'string' || typeof fileType !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing fileName or fileType.');
  }

  // Generate a unique key for the S3 object.
  // e.g., 'users/some-user-id/profile-pictures/a-unique-id.jpg'
  const s3Key = `users/${userId}/profile-pictures/${uuidv4()}-${fileName}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: fileType,
    Expires: 60 * 5, // URL expires in 5 minutes
    ACL: 'public-read', // Or adjust as needed
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);

    return {
      uploadUrl, // The URL the client will upload to
      s3Key,     // The key to save in Firestore after upload
    };
  } catch (error) {
    console.error('Failed to generate pre-signed URL:', error);
    throw new functions.https.HttpsError('internal', 'Could not generate upload URL.');
  }
});
