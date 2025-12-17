
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Album, Photo } from '@/types/gallery';

export const getAlbum = async (albumId: string): Promise<Album | null> => {
  try {
    const albumRef = doc(db, 'albums', albumId);
    const albumSnap = await getDoc(albumRef);

    if (albumSnap.exists()) {
      return albumSnap.data() as Album;
    }
    return null;
  } catch (error) {
    console.error('Error fetching album:', error);
    throw error;
  }
};

export const ensureDefaultAlbum = async (eventId: string): Promise<string> => {
    const albumsRef = collection(db, 'events', eventId, 'albums');
    const q = query(albumsRef, where('title', '==', 'Default Album'));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    } else {
        const newAlbumRef = await addDoc(albumsRef, {
            title: 'Default Album',
            createdAt: serverTimestamp(),
            isActive: true,
            sortOrder: 0,
        });
        return newAlbumRef.id;
    }
};

export const getEventCoverPhotoUrl = async (eventId: string): Promise<string | null> => {
    // This is a placeholder.
    // In a real app, you might fetch event details that include a cover photo URL.
    console.log("Fetching cover photo for event:", eventId)
    return null;
};

export const getUserAccessibleEventIds = async (userId: string): Promise<string[]> => {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const eventIds = querySnapshot.docs.map(doc => doc.data().eventId);
    return [...new Set(eventIds)] as string[];
};

export const listenAlbumPhotos = (
  eventId: string,
  albumId: string,
  callback: (photos: Photo[]) => void
): (() => void) => {
  const photosRef = collection(db, 'events', eventId, 'albums', albumId, 'photos');
  const q = query(photosRef);

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const photos: Photo[] = [];
    querySnapshot.forEach((doc) => {
      photos.push({ id: doc.id, ...doc.data() } as Photo);
    });
    callback(photos);
  });

  return unsubscribe;
};

export const createPhotoDoc = async (eventId: string, albumId: string, photoData: Omit<Photo, 'id'>) => {
    const photosRef = collection(db, 'events', eventId, 'albums', albumId, 'photos');
    await addDoc(photosRef, photoData);
}

export const getEventPhotoPreview = async (eventId: string): Promise<Photo | null> => {
    console.log("getEventPhotoPreview for eventId", eventId);
    return null;
}
