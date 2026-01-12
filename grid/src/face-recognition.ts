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

    // Only run if profile picture changed
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
      // Step 1: Detect faces in the profile picture
      const detectResponse = await rekognition
        .detectFaces({
          Image: {
            S3Object: {
              Bucket: s3Bucket,
              Name: s3ObjectKey,
            },
          },
          Attributes: ["DEFAULT"],
        })
        .promise();

      const faceCount = detectResponse.FaceDetails?.length || 0;

      if (faceCount !== 1) {
        console.warn(
          `Profile picture for user ${userId} has ${faceCount} faces (must be exactly 1).`
        );
        await admin.firestore().doc(`users/${userId}`).update({
          photoUrl: photoUrl,
          faceId: null,
          faceIndexedAt: null,
        });
        return null;
      }

      // Step 2: Delete old face if exists
      if (isNonEmptyString(before.faceId)) {
        await rekognition
          .deleteFaces({
            CollectionId: rekognitionCollectionId,
            FaceIds: [before.faceId],
          })
          .promise();
        console.log(`Deleted old face (${before.faceId}) for user ${userId}`);
      }

      // Step 3: Index the single face
      const response = await rekognition
        .indexFaces({
          CollectionId: rekognitionCollectionId,
          ExternalImageId: userId,
          MaxFaces: 1,
          DetectionAttributes: ["DEFAULT"],
          Image: {
            S3Object: {
              Bucket: s3Bucket,
              Name: s3ObjectKey,
            },
          },
        })
        .promise();

      if (!response.FaceRecords || response.FaceRecords.length !== 1) {
        console.warn(`Indexing failed: no valid face for user ${userId}`);
        await admin.firestore().doc(`users/${userId}`).update({
          photoUrl: photoUrl,
          faceId: null,
          faceIndexedAt: null,
        });
        return null;
      }

      const newFaceId = response.FaceRecords[0].Face?.FaceId;
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
      await admin.firestore().doc(`users/${userId}`).update({
        photoUrl: photoUrl,
        faceId: null,
        faceIndexedAt: null,
      });
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

    const region = functions.config().aws.region;
    const url = `https://${s3Bucket}.s3.${region}.amazonaws.com/${photo.s3Key}`;
    const updateData: any = {
      url: url,
      thumbUrl: url,
    };

    console.log(
      `Running face recognition for photo ${photoId} (event ${eventId})`
    );

    try {
      // Step 1: Index all faces in the photo (temporary)
      const indexResponse = await rekognition
        .indexFaces({
          CollectionId: rekognitionCollectionId,
          ExternalImageId: `temp-${photoId}`, // temporary tag
          DetectionAttributes: ["DEFAULT"],
          Image: {
            S3Object: {
              Bucket: s3Bucket,
              Name: photo.s3Key,
            },
          },
        })
        .promise();

      if (
        !indexResponse.FaceRecords ||
        indexResponse.FaceRecords.length === 0
      ) {
        console.log("No faces detected in photo");
        await snap.ref.update(updateData);
        return null;
      }

      console.log(`Detected ${indexResponse.FaceRecords.length} faces`);

      const recognizedUserIds: string[] = [];

      // Step 2: For each face, search against the collection
      for (const faceRecord of indexResponse.FaceRecords) {
        const faceId = faceRecord.Face?.FaceId;
        if (!isNonEmptyString(faceId)) continue;

        const searchResponse = await rekognition
          .searchFaces({
            CollectionId: rekognitionCollectionId,
            FaceId: faceId,
            FaceMatchThreshold: 60,
            MaxFaces: 5,
          })
          .promise();

        if (
          searchResponse.FaceMatches &&
          searchResponse.FaceMatches.length > 0
        ) {
          const matches = searchResponse.FaceMatches.map(
            (m) => m.Face?.ExternalImageId
          ).filter(isNonEmptyString);

          recognizedUserIds.push(...matches);
        }
      }

      // Step 3: Clean up temporary faces
      const tempFaceIds = indexResponse.FaceRecords.map(
        (rec) => rec.Face?.FaceId
      ).filter(isNonEmptyString);

      if (tempFaceIds.length > 0) {
        await rekognition
          .deleteFaces({
            CollectionId: rekognitionCollectionId,
            FaceIds: tempFaceIds,
          })
          .promise();
        console.log(`Cleaned up ${tempFaceIds.length} temporary faces`);
      }

      // Step 4: Update Firestore with recognized users
      if (recognizedUserIds.length > 0) {
        console.log(`Recognized users in photo ${photoId}:`, recognizedUserIds);
        updateData.recognizedUserIds = recognizedUserIds;
        updateData.recognitionProcessedAt =
          admin.firestore.FieldValue.serverTimestamp();

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
    } catch (error) {
      console.error(`Face recognition failed for photo ${photoId}`, error);
    } finally {
      await snap.ref.update(updateData);
      console.log(`Successfully updated photo ${photoId} with URLs.`);
    }

    return null;
  });
