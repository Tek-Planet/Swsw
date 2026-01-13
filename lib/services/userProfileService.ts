import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';

import { db } from '@/lib/firebase/firebaseConfig';
import { UserProfile } from '@/types/user';

export const listenToUserProfile = (
  userId: string,
  callback: (profile: UserProfile | null) => void
) => {
  const userDoc = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(userDoc, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as UserProfile);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

export const listenToUserProfiles = (
  userIds: string[],
  callback: (profiles: UserProfile[]) => void
) => {
  if (userIds.length === 0) {
    callback([]);
    return () => {};
  }

  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, where('__name__', 'in', userIds));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const profiles = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserProfile[];
    callback(profiles);
  });

  return unsubscribe;
};
