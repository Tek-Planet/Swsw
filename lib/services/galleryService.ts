
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
  doc,
  addDoc,
  serverTimestamp,
  collectionGroup,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Album, Photo } from '@/types/gallery';

// --- [NEW] S3 Configuration. Replace with your actual bucket details.
// It's safe to expose the bucket name and region on the client-side for public-read objects.
const S3_BUCKET_NAME = 'photobooth-23f98.appspot.com';
const S3_REGION = 'us-east-1';

// --- [NEW] Helper to construct the public URL from an S3 key.
const getPublicUrlFromS3Key = (s3Key: string) => {
  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
};

/**
 * Maps a Firestore document to a Photo object, constructing the display URL.
 */
const mapDocToPhoto = (doc: any): Photo => {
  const data = doc.data();
  const photo: Photo = {
    id: doc.id,
    s3Key: data.s3Key,
    // Dynamically generate the URL for the UI
    url: getPublicUrlFromS3Key(data.s3Key),
    thumbUrl: getPublicUrlFromS3Key(data.s3Key), // Use the same for simplicity
    ...data,
  };
  return photo;
};

/**
 * Listens for real-time updates to the photos within a specific album.
 */
export function listenAlbumPhotos(
  eventId: string,
  albumId: string,
  callback: (photos: Photo[]) => void
): Unsubscribe {
  const photosQuery = query(
    collection(db, 'events', eventId, 'albums', albumId, 'photos'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(photosQuery, (snapshot) => {
    const photos = snapshot.docs.map(mapDocToPhoto); // [UPDATED]
    callback(photos);
  });
}

/**
 * Fetches a preview of photos for an event.
 */
export async function getEventPhotoPreview(
  eventId: string,
  limitPhotos: number = 6
): Promise<{ albums: Album[]; previewPhotos: Photo[]; initialAlbumId?: string }> {
  const albumsQuery = query(
    collection(db, 'events', eventId, 'albums'),
    where('isActive', '==', true),
    orderBy('sortOrder', 'asc'),
    limit(3)
  );

  const albumSnapshot = await getDocs(albumsQuery);
  if (albumSnapshot.empty) {
    return { albums: [], previewPhotos: [], initialAlbumId: undefined };
  }

  const albums = albumSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
  const initialAlbumId = albums[0].id;

  const photosQuery = query(
    collection(db, 'events', eventId, 'albums', initialAlbumId, 'photos'),
    orderBy('createdAt', 'desc'),
    limit(limitPhotos)
  );

  const photoSnapshot = await getDocs(photosQuery);
  const previewPhotos = photoSnapshot.docs.map(mapDocToPhoto); // [UPDATED]

  return { albums, previewPhotos, initialAlbumId };
}

/**
 * Ensures a default album exists for an event, creating one if necessary.
 */
export async function ensureDefaultAlbum(eventId: string): Promise<string> {
    const albumsRef = collection(db, 'events', eventId, 'albums');
    const q = query(albumsRef, where('title', '==', 'Event Photos'), limit(1));
    const snapshot = await getDocs(q);
  
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    } else {
      const albumData = {
        title: 'Event Photos',
        isActive: true,
        sortOrder: 0,
        createdAt: serverTimestamp(),
        photoCount: 0,
      };
      const docRef = await addDoc(albumsRef, albumData);
      return docRef.id;
    }
}

/**
 * Creates a new photo document in a specific album.
 */
export async function createPhotoDoc(
    eventId: string,
    albumId: string,
    photoData: Partial<Photo>
): Promise<void> {
    const photosRef = collection(db, 'events', eventId, 'albums', albumId, 'photos');
    await addDoc(photosRef, photoData);
}

// Other functions like listenEventAlbums, getUserAccessibleEventIds, etc. remain unchanged.
