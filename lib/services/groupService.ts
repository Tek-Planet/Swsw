
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Group } from '@/types/group';
import { UserProfile } from '@/types/user';

const userCollection = collection(db, 'users');
const groupCollection = collection(db, 'groups');


// Helper to convert Firestore doc to Group object
const groupFromDoc = (doc: DocumentData): Group => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
    } as Group;
}

export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);

    if (groupSnap.exists()) {
      return groupFromDoc(groupSnap);
    }
    return null;
  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
};

export const listenToGroup = (groupId: string, callback: (group: Group | null) => void) => {
    const groupRef = doc(db, 'groups', groupId);

    const unsubscribe = onSnapshot(groupRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(groupFromDoc(docSnap));
        } else {
            callback(null);
        }
    }, (error) => {
        console.error(`Error listening to group ${groupId}:`, error);
        callback(null);
    });

    return unsubscribe;
}

export const listenToUserGroups = (userId: string, callback: (groups: Group[]) => void) => {
  const groupsQuery = query(groupCollection, where('members', 'array-contains', userId));

  return onSnapshot(groupsQuery, (querySnapshot) => {
    const groups = querySnapshot.docs.map(doc => groupFromDoc(doc));
    callback(groups);
  });
};

export const createGroup = async (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const groupWithTimestamps = {
      ...group,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(groupCollection, groupWithTimestamps);
    return docRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export async function getProfilesForUserIds(userIds: string[]): Promise<Map<string, UserProfile>> {
    const profiles = new Map<string, UserProfile>();
    if (!userIds || userIds.length === 0) return profiles;
  
    const batches: string[][] = [];
    for (let i = 0; i < userIds.length; i += 10) {
      batches.push(userIds.slice(i, i + 10));
    }
  
    await Promise.all(
      batches.map(async (batch) => {
        if(batch.length === 0) return;
        const q = query(userCollection, where('__name__', 'in', batch));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          profiles.set(doc.id, doc.data() as UserProfile);
        });
      })
    );
  
    return profiles;
  }
