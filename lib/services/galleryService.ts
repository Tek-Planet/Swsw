
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { PhotoAlbum } from '@/types';

export const getAlbum = async (albumId: string): Promise<PhotoAlbum | null> => {
  try {
    const albumRef = doc(db, 'albums', albumId);
    const albumSnap = await getDoc(albumRef);

    if (albumSnap.exists()) {
      return albumSnap.data() as PhotoAlbum;
    }
    return null;
  } catch (error) {
    console.error('Error fetching album:', error);
    throw error;
  }
};
