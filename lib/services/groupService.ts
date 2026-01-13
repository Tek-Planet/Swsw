import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Group } from '@/types/group';

export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);

    if (groupSnap.exists()) {
      return { id: groupSnap.id, ...groupSnap.data() } as Group;
    }
    return null;
  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
};

export const listenToUserGroups = (userId: string, callback: (groups: Group[]) => void) => {
  const groupsQuery = query(collection(db, 'groups'), where('members', 'array-contains', userId));

  return onSnapshot(groupsQuery, (querySnapshot) => {
    const groups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    callback(groups);
  });
};

export const createGroup = async (group: Omit<Group, 'id'>) => {
  try {
    const groupWithTimestamps = {
      ...group,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'groups'), groupWithTimestamps);
    return docRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};
