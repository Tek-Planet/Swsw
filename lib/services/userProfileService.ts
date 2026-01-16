
import { doc, getDoc, setDoc, onSnapshot, Timestamp, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { UserProfile } from '@/types/user';

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { uid: userSnap.id, ...userSnap.data() } as unknown as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const createOrUpdateUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...profileData, updatedAt: Timestamp.now() }, { merge: true });
  } catch (error) {
    console.error('Error creating or updating user profile:', error);
    throw error;
  }
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

export const listenToUserProfiles = (userIds: string[], callback: (profiles: UserProfile[]) => void) => {
    if (!userIds || userIds.length === 0) {
        callback([]);
        return () => {};
    }

    const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', userIds));

    const unsubscribe = onSnapshot(usersQuery,
        (querySnapshot) => {
            const profiles = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as UserProfile));
            callback(profiles);
        },
        (error) => {
            console.error("Error listening to user profiles:", error);
            callback([]);
        }
    );

    return unsubscribe;
};

export const getUserProfiles = async (userIds: string[]): Promise<UserProfile[]> => {
    if (!userIds || userIds.length === 0) {
        return [];
    }
    try {
        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', userIds));
        const querySnapshot = await getDocs(usersQuery);
        const profiles = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as UserProfile));
        return profiles;
    } catch (error) {
        console.error("Error getting user profiles:", error);
        return [];
    }
};

export const disableUserAccount = async (uid: string): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(
    userDocRef,
    { status: 'disabled', updatedAt: Timestamp.now() },
    { merge: true }
  );
};
