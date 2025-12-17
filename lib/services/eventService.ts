
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Event, FirestoreEvent } from '@/types/event';
import { UserProfile } from '@/types/user';

const eventCollection = collection(db, 'events');
const userCollection = collection(db, 'users');

const getEventDocRef = (eventId: string) => doc(db, 'events', eventId);

const eventFromDoc = (doc: QueryDocumentSnapshot<DocumentData>): Event => {
  const data = doc.data() as FirestoreEvent;
  return {
    ...data,
    id: doc.id,
    startTime: data.startTime.toDate(),
    endTime: data.endTime.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

export async function getEvent(eventId: string): Promise<Event | null> {
    try {
      const eventRef = getEventDocRef(eventId);
      const docSnap = await getDoc(eventRef);
  
      if (docSnap.exists()) {
        return eventFromDoc(docSnap as QueryDocumentSnapshot<DocumentData>);
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      return null;
    }
  }

export async function getProfilesForUserIds(userIds: string[]): Promise<Map<string, UserProfile>> {
  const profiles = new Map<string, UserProfile>();
  if (!userIds || userIds.length === 0) return profiles;

  const batches: string[][] = [];
  for (let i = 0; i < userIds.length; i += 10) {
    batches.push(userIds.slice(i, i + 10));
  }

  await Promise.all(
    batches.map(async (batch) => {
      const q = query(userCollection, where('__name__', 'in', batch));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        profiles.set(doc.id, doc.data() as UserProfile);
      });
    })
  );

  return profiles;
}

export function listenToEvent(
  eventId: string,
  callback: (event: Event | null) => void
): () => void {
  const eventRef = getEventDocRef(eventId);

  const unsubscribe = onSnapshot(eventRef, async (docSnap) => {
    if (docSnap.exists()) {
      const eventData = eventFromDoc(docSnap as QueryDocumentSnapshot<DocumentData>);

      if (eventData.hostId) {
        try {
          const userDocRef = doc(userCollection, eventData.hostId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserProfile;
            eventData.hostAvatarUrl = userData.photoUrl;
          }
        } catch (error) {
          console.error("Error fetching host profile:", error);
        }
      }

      callback(eventData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error listening to event:", error);
    callback(null);
  });

  return unsubscribe;
}

export function listenToUserUpcomingEvents(
    userId: string,
    callback: (events: Event[]) => void
  ): () => void {
    const now = new Date();
    const q = query(
      eventCollection,
      where('status', '==', 'published'),
      where('attendeeIds', 'array-contains', userId),
      where('startTime', '>=', now),
      orderBy('startTime', 'asc'),
      limit(3)
    );
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const events = querySnapshot.docs.map(doc => eventFromDoc(doc));
      callback(events);
    }, (error) => {
      console.error("Error listening to user upcoming events:", error);
    });
  
    return unsubscribe;
}

export function listenToRecommendedEvents(
  userId: string,
  interests: string[],
  callback: (events: Event[]) => void
): () => void {
  if (!interests || interests.length === 0) {
    callback([]);
    return () => {};
  }

  const lowerCaseInterests = interests.map(interest => interest.toLowerCase());

  const now = new Date();
  const q = query(
    eventCollection,
    where('status', '==', 'published'),
    where('visibility', '==', 'public'),
    where('startTime', '>=', now),
    where('tags', 'array-contains-any', lowerCaseInterests),
    orderBy('startTime', 'asc'),
    limit(10)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs
      .map(doc => eventFromDoc(doc))
      .filter(event => !event.attendeeIds.includes(userId));

    callback(events.slice(0, 5));
  }, (error) => {
    console.error("Error listening to recommended events:", error);
  });

  return unsubscribe;
}

export function listenToTrendingEvents(
  callback: (events: Event[]) => void
): () => void {
  const now = new Date();
  const q = query(
    eventCollection,
    where('status', '==', 'published'),
    where('visibility', '==', 'public'),
    where('startTime', '>=', now),
    orderBy('popularityScore', 'desc'),
    orderBy('startTime', 'asc'),
    limit(10)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs.map(doc => eventFromDoc(doc));
    callback(events);
  }, (error) => {
    console.error("Error listening to trending events:", error);
  });

  return unsubscribe;
}

export function listenToMostRecentEvent(
  uid: string,
  callback: (event: Event | null) => void
): () => void {
  const userEventsRef = collection(db, 'users', uid, 'user_events');
  const q = query(
    userEventsRef,
    orderBy('eventDate', 'desc'),
    limit(1)
  );

  return onSnapshot(q, async (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    const userEvent = snapshot.docs[0].data();
    const eventDocRef = doc(db, 'events', userEvent.eventId);
    const eventDoc = await getDoc(eventDocRef);

    if (eventDoc.exists()) {
      const eventData = eventFromDoc(eventDoc as QueryDocumentSnapshot<DocumentData>);
      callback(eventData);
    } else {
      callback(null);
    }
  });
}
