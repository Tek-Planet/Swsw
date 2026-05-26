import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { devConfig, prodConfig } from '../config/firebase.config';

// Detect Instagram / Facebook in-app browser
const isMetaWebView = () => {
  const ua = navigator.userAgent || navigator.vendor || "";
  return /FBAN|FBAV|Instagram/.test(ua);
};

const firebaseConfig = import.meta.env.VITE_ENV === "production" ? prodConfig : devConfig;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;
let storage: FirebaseStorage;

try {
  app = initializeApp(firebaseConfig);

  // Normal initialization (safe in all browsers)
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  storage = getStorage(app);

} catch (e) {
  console.error('Firebase init failed:', e);

  // Create minimal stubs so imports don't crash
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  functions = {} as Functions;
  storage = {} as FirebaseStorage;
}

export { auth, db, functions, storage };

/**
 * Upload image to Firebase Storage with progress callback
 */
export const uploadEventImage = async (
  file: File,
  eventId?: string,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    const folder = eventId ? `events/${eventId}` : 'events/temp';
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[uploadEventImage] Progress:', progress.toFixed(0) + '%');
          onProgress?.(progress);
        },
        (error) => {
          console.error('[uploadEventImage] Upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('[uploadEventImage] Complete. URL:', downloadURL);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('[uploadEventImage] Error:', error);
    return null;
  }
};

export default app;
