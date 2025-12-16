
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, getDocs, limit } from 'firebase/firestore';
import { Album, Photo } from '../../types/gallery';

/**
 * Listens for real-time updates on active albums for a specific event.
 */
export function listenEventAlbums(
  eventId: string,
  callback: (albums: Album[]) => void
): () => void {
  const albumsQuery = query(
    collection(db, 'events', eventId, 'albums'),
    where('isActive', '==', true),
    orderBy('sortOrder', 'asc')
  );

  return onSnapshot(albumsQuery, (snapshot) => {
    const albums = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Album[];
    callback(albums);
  });
}

/**
 * Listens for real-time updates on photos for a specific album.
 */
export function listenAlbumPhotos(
  eventId: string,
  albumId: string,
  callback: (photos: Photo[]) => void,
  limitCount?: number
): () => void {
  let photosQuery = query(
    collection(db, 'events', eventId, 'albums', albumId, 'photos'),
    orderBy('createdAt', 'desc')
  );

  if (limitCount) {
    photosQuery = query(photosQuery, limit(limitCount));
  }

  return onSnapshot(photosQuery, (snapshot) => {
    const photos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Photo[];
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
  const albums = albumSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Album[];

  const initialAlbumId = albums.length > 0 ? albums[0].id : undefined;
  let previewPhotos: Photo[] = [];

  if (initialAlbumId) {
    const photosQuery = query(
      collection(db, 'events', eventId, 'albums', initialAlbumId, 'photos'),
      orderBy('createdAt', 'desc'),
      limit(limitPhotos)
    );
    const photoSnapshot = await getDocs(photosQuery);
    previewPhotos = photoSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Photo[];
  }

  return { albums, previewPhotos, initialAlbumId };
}
