import AWS from 'aws-sdk';
import * as functions from 'firebase-functions/v1';
import { admin, } from "./lib/firebase";

/* -------------------------------------------------------------------------- */
/*                               AWS CONFIG                                   */
/* -------------------------------------------------------------------------- */

const awsRegion = functions.config().aws.region;
const s3Bucket = functions.config().aws.s3_bucket;
const rekognitionCollectionId =
  functions.config().rekognition.collection_id;

AWS.config.update({
  region: awsRegion,
  accessKeyId: functions.config().aws.access_key_id,
  secretAccessKey: functions.config().aws.secret_access_key,
});

const rekognition = new AWS.Rekognition();

/* -------------------------------------------------------------------------- */
/*                        HELPER: SAFE STRING CHECK                            */
/* -------------------------------------------------------------------------- */

const isNonEmptyString = (value?: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/* -------------------------------------------------------------------------- */
/* 1️⃣ INDEX USER PROFILE PICTURE (FACE REGISTRATION)                           */
/* -------------------------------------------------------------------------- */

export const indexUserProfilePicture = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) {
      console.warn('User document missing');
      return null;
    }

    // Only run if profile picture changed
    if (before.profilePictureS3Key === after.profilePictureS3Key) {
      return null;
    }

    if (!isNonEmptyString(after.profilePictureS3Key)) {
      console.warn(`User ${userId} has no S3 profile picture key`);
      return null;
    }

    const s3ObjectKey = after.profilePictureS3Key;

    console.log(`Indexing face for user ${userId}`);

    try {
      // Remove old faces for this user (idempotency)
      await rekognition
        .deleteFaces({
          CollectionId: rekognitionCollectionId,
          FaceIds: [], // optional: skip if you want to keep history
        })
        .promise()
        .catch(() => null);

      const response = await rekognition
        .indexFaces({
          CollectionId: rekognitionCollectionId,
          ExternalImageId: userId,
          DetectionAttributes: [],
          Image: {
            S3Object: {
              Bucket: s3Bucket,
              Name: s3ObjectKey,
            },
          },
        })
        .promise();

      if (!response.FaceRecords || response.FaceRecords.length === 0) {
        console.warn(`No face detected for user ${userId}`);
        return null;
      }

      console.log(
        `Successfully indexed ${response.FaceRecords.length} face(s) for ${userId}`
      );

      await admin.firestore().doc(`users/${userId}`).update({
        faceIndexedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (error) {
      console.error(`Face indexing failed for user ${userId}`, error);
      return null;
    }
  });

/* -------------------------------------------------------------------------- */
/* 2️⃣ EVENT PHOTO FACE MATCHING + TAGGING                                     */
/* -------------------------------------------------------------------------- */

export const onPhotoCreated = functions.firestore
  .document('events/{eventId}/albums/{albumId}/photos/{photoId}')
  .onCreate(async (snap, context) => {
    const photo = snap.data();
    const { eventId, photoId } = context.params;

    if (!photo) {
      console.warn('Photo document missing');
      return null;
    }

    if (!isNonEmptyString(photo.s3Key)) {
      console.warn(`Photo ${photoId} has no S3 key`);
      return null;
    }

    console.log(
      `Running face recognition for photo ${photoId} (event ${eventId})`
    );

    try {
      const response = await rekognition
        .searchFacesByImage({
          CollectionId: rekognitionCollectionId,
          FaceMatchThreshold: 95,
          MaxFaces: 10,
          Image: {
            S3Object: {
              Bucket: s3Bucket,
              Name: photo.s3Key,
            },
          },
        })
        .promise();

      if (!response.FaceMatches || response.FaceMatches.length === 0) {
        console.log('No faces recognized');
        return null;
      }

      const recognizedUserIds = response.FaceMatches
        .map(match => match.Face?.ExternalImageId)
        .filter(isNonEmptyString);

      if (recognizedUserIds.length === 0) {
        console.log('Faces detected but no valid user matches');
        return null;
      }

      console.log(
        `Recognized users in photo ${photoId}:`,
        recognizedUserIds
      );

      // Update photo document
      await snap.ref.update({
        recognizedUserIds,
        recognitionProcessedAt:
          admin.firestore.FieldValue.serverTimestamp(),
      });

      // Fan-out writes
      const batch = admin.firestore().batch();

      for (const userId of recognizedUserIds) {
        const userPhotoRef = admin
          .firestore()
          .collection('user_photos')
          .doc(userId)
          .collection('my_photos')
          .doc(photoId);

        batch.set(
          userPhotoRef,
          {
            originalPhotoId: photoId,
            eventId,
            photoS3Key: photo.s3Key,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      await batch.commit();

      console.log(
        `Tagged ${recognizedUserIds.length} users for photo ${photoId}`
      );

      return null;
    } catch (error) {
      console.error(
        `Face recognition failed for photo ${photoId}`,
        error
      );
      return null;
    }
  });

  