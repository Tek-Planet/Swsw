
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserProfile } from '@/types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserProfile;
  }

  return null;
};

export const createOrUpdateUserProfile = async (
  uid: string,
  partial: Partial<UserProfile>
): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(
    userDocRef,
    { ...partial, updatedAt: Timestamp.now() },
    { merge: true }
  );
};

export const listenToUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void
) => {
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(userDocRef, (doc) => {
    callback(doc.data() as UserProfile | null);
  });
};

export const updateUserProfile = async (
  uid: string,
  partial: Partial<UserProfile>
): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(
    userDocRef,
    { ...partial, updatedAt: Timestamp.now() },
    { merge: true }
  );
};
