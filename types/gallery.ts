
import { FieldValue } from 'firebase/firestore';

export type Album = {
  id: string;
  title: string;
  coverPhotoUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date | FieldValue;
  photoCount?: number;
};

/**
 * Represents a photo within an event album.
 * This type is used both for Firestore documents and for client-side display.
 */
export type Photo = {
  id: string;

  // --- NEW: The key (path) to the image object in the S3 bucket.
  // This is the source of truth for the image location.
  s3Key: string;

  // The full, public URL to the image. This is dynamically generated
  // on the client-side for rendering, and is not stored in Firestore.
  url?: string;

  // (Optional) A URL for a smaller thumbnail version of the image.
  // Can also be generated dynamically.
  thumbUrl?: string;

  // Metadata about the upload
  uploadedBy: "host" | "user";
  uploaderId: string;
  createdAt?: Date | FieldValue;

  // --- FOR FACE RECOGNITION ---
  // An array of user IDs of people recognized in the photo.
  // This is populated by the onPhotoCreated backend function.
  taggedUserIds?: string[];
  recognitionProcessedAt?: Date | FieldValue; // Timestamp for when processing was done
};
