import AWS from "aws-sdk";
import * as functions from "firebase-functions/v1";
import { admin } from "./lib/firebase";

const s3Bucket = functions.config().aws.s3_bucket;
const rekognitionCollectionId = functions.config().rekognition.collection_id;

const rekognition = new AWS.Rekognition({
  region: functions.config().aws.region,
  accessKeyId: functions.config().aws.access_key_id,
  secretAccessKey: functions.config().aws.secret_access_key,
});

const isNonEmptyString = (value?: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const indexUserProfilePicture = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) {
      console.log("User document missing");
      return null;
    }

    if (before.profilePictureS3Key === after.profilePictureS3Key) {
      console.log("Profile picture S3 key has not changed.");
      return null;
    }

    const s3ObjectKey = after.profilePictureS3Key;

    if (!isNonEmptyString(s3ObjectKey)) {
      console.log(`S3 profile picture key was removed for user ${userId}.`);
      return null;
    }

    const photoUrl = `https://${s3Bucket}.s3.${
      functions.config().aws.region
    }.amazonaws.com/${s3ObjectKey}`;

    console.log(
      `Indexing face for user ${userId} from s3://${s3Bucket}/${s3ObjectKey}`
    );

    try {
      if (isNonEmptyString(before.faceId)) {
        await rekognition
          .deleteFaces({
            CollectionId: rekognitionCollectionId,
            FaceIds: [before.faceId],
          })
          .promise();
        console.log(
          `Successfully deleted old face (${before.faceId}) for user ${userId}`
        );
      }

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
        console.warn(
          `No face could be detected in the image for user ${userId}.`
        );
        await admin.firestore().doc(`users/${userId}`).update({
          photoUrl: photoUrl,
          faceId: null,
          faceIndexedAt: null,
        });
        return null;
      }

      const faceRecord = response.FaceRecords[0];
      const newFaceId = faceRecord.Face?.FaceId;

      if (!isNonEmptyString(newFaceId)) {
        throw new Error("indexFaces response did not include a FaceId.");
      }

      console.log(
        `Successfully indexed new face (${newFaceId}) for user ${userId}`
      );

      await admin.firestore().doc(`users/${userId}`).update({
        photoUrl: photoUrl,
        faceId: newFaceId,
        faceIndexedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (error) {
      console.error(`Face indexing failed for user ${userId}`, error);
      await admin
        .firestore()
        .doc(`users/${userId}`)
        .update({
          photoUrl: photoUrl,
        })
        .catch((e) => console.error("Failed to write fallback photoUrl", e));
      return null;
    }
  });

export const onPhotoCreated = functions.firestore
  .document("events/{eventId}/albums/{albumId}/photos/{photoId}")
  .onCreate(async (snap, context) => {
    const photo = snap.data();
    const { eventId, photoId } = context.params;

    if (!photo || !isNonEmptyString(photo.s3Key)) {
      console.warn(`Photo ${photoId} has no S3 key or document is missing.`);
      return null;
    }

    // [FIXED] Construct the public URL and a placeholder for the thumbnail.
    const region = functions.config().aws.region;
    const url = `https://${s3Bucket}.s3.${region}.amazonaws.com/${photo.s3Key}`;
    const updateData: any = {
      url: url,
      thumbUrl: url, // For now, we'll use the same URL for the thumbnail.
    };

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

      if (response.FaceMatches && response.FaceMatches.length > 0) {
        const recognizedUserIds = response.FaceMatches.map(
          (match) => match.Face?.ExternalImageId
        ).filter(isNonEmptyString);

        if (recognizedUserIds.length > 0) {
          console.log(
            `Recognized users in photo ${photoId}:`,
            recognizedUserIds
          );
          updateData.recognizedUserIds = recognizedUserIds;
          updateData.recognitionProcessedAt =
            admin.firestore.FieldValue.serverTimestamp();

          // Fan-out writes for recognized users
          const batch = admin.firestore().batch();
          for (const userId of recognizedUserIds) {
            const userPhotoRef = admin
              .firestore()
              .collection("user_photos")
              .doc(userId)
              .collection("my_photos")
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
        } else {
          console.log("Faces detected but no valid user matches");
        }
      } else {
        console.log("No faces recognized");
      }
    } catch (error) {
      console.error(`Face recognition failed for photo ${photoId}`, error);
      // Don't halt; we still want to save the URLs.
    } finally {
      // [FIXED] Always update the document with the URLs.
      await snap.ref.update(updateData);
      console.log(`Successfully updated photo ${photoId} with URLs.`);
    }

    return null;
  });
