
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
  documentId,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase/firebaseConfig';
import { Event, FirestoreEvent } from '@/types/event';
import { UserProfile } from '@/types/user';

const functions = getFunctions();
const eventCollection = collection(db, 'events');
const userCollection = collection(db, 'users');
const ordersCollection = collection(db, 'orders');

const getEventDocRef = (eventId: string) => doc(db, 'events', eventId);

const eventFromDoc = (doc: QueryDocumentSnapshot<DocumentData>): Event => {
  const data = doc.data() as FirestoreEvent;
  return {
    ...data,
    id: doc.id,
    startTime: data.startTime ? data.startTime.toDate() : new Date(),
    endTime: data.endTime ? data.endTime.toDate() : new Date(),
    createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
    // Handle potential showtime timestamp
    ...(data.showtime && { showtime: data.showtime.toDate() }),
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
      console.error('Error fetching event:', error);
      return null;
    }
}

// --- NEW createOrder FUNCTION ---
interface OrderPayload {
  orderType: 'movie' | 'regular';
  eventId: string;
  items: any; // Could be seat IDs or tier selections
  total: number;
  currency: string;
}

export const createOrder = async (payload: OrderPayload): Promise<{ clientSecret: string; orderId: string; free: boolean; }> => {
  console.log(`Creating order with type: ${payload.orderType}`);
  
  const functionName = payload.orderType === 'movie' 
    ? 'createMovieOrder' 
    : 'createTieredOrder'; // Assuming this is the name for regular orders

  try {
    const createOrderFunction = httpsCallable(functions, functionName);
    const result = await createOrderFunction(payload);
    const data = result.data as { clientSecret: string; orderId: string; free: boolean; };
    
    if (!data.orderId) {
        throw new Error('Invalid response from create order function.');
    }

    return data;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw new Error('Failed to create order. Please try again.');
  }
};


export async function getProfilesForUserIds(userIds: string[]): Promise<Map<string, UserProfile>> {
  const profiles = new Map<string, UserProfile>();
  if (!userIds || userIds.length === 0) return profiles;

  const batches: string[][] = [];
  for (let i = 0; i < userIds.length; i += 30) {
    batches.push(userIds.slice(i, i + 30));
  }

  await Promise.all(
    batches.map(async (batch) => {
      const q = query(userCollection, where(documentId(), 'in', batch));
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
          console.error('Error fetching host profile:', error);
        }
      }

      callback(eventData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to event:', error);
    callback(null);
  });

  return unsubscribe;
}

// Keep all other listening functions as they are...
export function listenToUserUpcomingEvents(
    userId: string,
    callback: (events: Event[]) => void
  ): () => void {
    const ordersQuery = query(
      ordersCollection,
      where('userId', '==', userId),
      where('status', '==', 'paid')
    );

    const unsubscribe = onSnapshot(ordersQuery, async (ordersSnapshot) => {
      if (ordersSnapshot.empty) {
        callback([]);
        return;
      }

      const eventIds = [...new Set(ordersSnapshot.docs.map(doc => doc.data().eventId))];

      if (eventIds.length === 0) {
        callback([]);
        return;
      }

      const allEvents: Event[] = [];
      const eventIdBatches: string[][] = [];
      for (let i = 0; i < eventIds.length; i += 30) {
        eventIdBatches.push(eventIds.slice(i, i + 30));
      }

      await Promise.all(
        eventIdBatches.map(async (batch) => {
          if (batch.length === 0) return;
          const eventsQuery = query(eventCollection, where(documentId(), 'in', batch));
          const eventsSnapshot = await getDocs(eventsQuery);
          const batchEvents = eventsSnapshot.docs.map(doc => eventFromDoc(doc));
          allEvents.push(...batchEvents);
        })
      );
      
      const now = new Date();
      const upcomingEvents = allEvents
        .filter(event => event.startTime >= now)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
      callback(upcomingEvents.slice(0, 10));

    }, (error) => {
      console.error('Error listening to user upcoming events:', error);
    });
  
    return unsubscribe;
}

export function listenToUserPastEvents(
  userId: string,
  callback: (events: Event[]) => void
): () => void {
  const ordersQuery = query(
    ordersCollection,
    where('userId', '==', userId),
    where('status', '==', 'paid')
  );

  const unsubscribe = onSnapshot(ordersQuery, async (ordersSnapshot) => {
    if (ordersSnapshot.empty) {
      callback([]);
      return;
    }

    const eventIds = [...new Set(ordersSnapshot.docs.map(doc => doc.data().eventId))];

    if (eventIds.length === 0) {
      callback([]);
      return;
    }

    const allEvents: Event[] = [];
      const eventIdBatches: string[][] = [];
      for (let i = 0; i < eventIds.length; i += 30) {
        eventIdBatches.push(eventIds.slice(i, i + 30));
      }

      await Promise.all(
        eventIdBatches.map(async (batch) => {
          if (batch.length === 0) return;
          const eventsQuery = query(eventCollection, where(documentId(), 'in', batch));
          const eventsSnapshot = await getDocs(eventsQuery);
          const batchEvents = eventsSnapshot.docs.map(doc => eventFromDoc(doc));
          allEvents.push(...batchEvents);
        })
      );

    const now = new Date();
    const pastEvents = allEvents
      .filter(event => event.startTime < now)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      
    callback(pastEvents.slice(0, 10));

  }, (error) => {
    console.error('Error listening to user past events:', error);
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
    console.error('Error listening to recommended events:', error);
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
    console.error('Error listening to trending events:', error);
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

export function listenToGroupEvents(
  groupId: string,
  callback: (events: Event[]) => void
): () => void {
  const now = new Date();
  const q = query(
    eventCollection,
    where('groupId', '==', groupId),
    where('startTime', '>=', now),
    orderBy('startTime', 'asc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs.map(doc => eventFromDoc(doc));
    callback(events);
  }, (error) => {
    console.error(`Error listening to group events for group ${groupId}:`, error);
  });

  return unsubscribe;
}
