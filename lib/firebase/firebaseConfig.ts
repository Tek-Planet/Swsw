import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import Constants from "expo-constants";

const firebaseConfig = Constants?.expoConfig?.extra?.firebase; if (!firebaseConfig) { throw new Error("Firebase config is missing. Check your app.config.js and EAS env vars."); }

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();


let auth: Auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Fallback for fast refresh
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
