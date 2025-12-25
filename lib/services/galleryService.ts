
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Album, Photo } from '@/types/gallery';

/**
 * Listens for real-time updates to the albums of a specific event.
 */
export function listenEventAlbums(
  eventId: string,
  callback: (albums: Album[]) => void
): Unsubscribe {
  const albumsQuery = query(
    collection(db, 'events', eventId, 'albums'),
    where('isActive', '==', true),
    orderBy('sortOrder', 'asc')
  );

  return onSnapshot(albumsQuery, (snapshot) => {
    const albums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
    callback(albums);
  });
}

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
    const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
    callback(photos);
  });
}

/**
 * Fetches a preview of photos for an event, including the first few albums and initial photos.
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
  const previewPhotos = photoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));

  return { albums, previewPhotos, initialAlbumId };
}

/**
 * Ensures a default album exists for an event, creating one if necessary.
 * Returns the ID of the default album.
 */
export async function ensureDefaultAlbum(eventId: string): Promise<string> {
  const albumsRef = collection(db, 'events', eventId, 'albums');
  const q = query(albumsRef, where('title', '==', 'Event Photos'), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // Default album already exists
    return snapshot.docs[0].id;
  } else {
    // Create default album
    const albumData = {
      title: 'Event Photos',
      isActive: true,
      sortOrder: 0,
      createdAt: serverTimestamp(),
      photoCount: 0,
      coverPhotoUrl: '',
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
  photoData: Omit<Photo, 'id'>
): Promise<void> {
  const photosRef = collection(db, 'events', eventId, 'albums', albumId, 'photos');
  await addDoc(photosRef, photoData);
}

/**
 * Retrieves a list of event IDs for which the user is an attendee.
 */
export async function getUserAccessibleEventIds(uid: string): Promise<string[]> {
  const eventsQuery = query(collection(db, 'events'), where('attendeeIds', 'array-contains', uid));
  const snapshot = await getDocs(eventsQuery);

  if (snapshot.empty) {
    return [];
  }

  const eventIds = snapshot.docs.map(doc => doc.id as string);
  return [...new Set(eventIds)];
}

/**
* Gets the cover photo URL for a given event (first photo of the default album).
*/
export async function getEventCoverPhotoUrl(eventId: string): Promise<string | null> {
  try {
      const albumId = await ensureDefaultAlbum(eventId);

      const photosQuery = query(
          collection(db, 'events', eventId, 'albums', albumId, 'photos'),
          orderBy('createdAt', 'desc'),
          limit(1)
      );

      const photoSnapshot = await getDocs(photosQuery);

      if (photoSnapshot.empty) {
          return null;
      }

      const photo = photoSnapshot.docs[0].data();
      return photo.thumbUrl || photo.url || null;
  } catch (error) {
      console.error(`Failed to get cover photo for event ${eventId}:`, error);
      return null;
  }
}
