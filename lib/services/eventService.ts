
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Event, FirestoreEvent, EventAttendee } from '@/types/event';
import { UserProfile } from '@/types/user';

// --- Helper Functions ---

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

// --- User Profile Functions ---

export async function getProfilesForUserIds(userIds: string[]): Promise<Map<string, UserProfile>> {
  const profiles = new Map<string, UserProfile>();
  if (!userIds || userIds.length === 0) {
    return profiles;
  }

  // Firestore 'in' queries are limited to 10 items per query.
  // We need to batch our requests to handle more than 10 user IDs.
  const batches: string[][] = [];
  for (let i = 0; i < userIds.length; i += 10) {
    batches.push(userIds.slice(i, i + 10));
  }

  try {
    const fetchPromises = batches.map(async (batch) => {
      const q = query(userCollection, where('__name__', 'in', batch));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        profiles.set(doc.id, doc.data() as UserProfile);
      });
    });

    await Promise.all(fetchPromises);

  } catch (error) {
    console.error("Error fetching user profiles:", error);
    // Depending on requirements, you might want to handle this error more gracefully
  }

  return profiles;
}


// --- CRUD Functions ---

export async function createEvent(
  data: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'attendeesCount' | 'likesCount' | 'popularityScore' | 'attendeeIds'>
): Promise<string> {
  try {
    const processedData = {
      ...data,
      // Ensure tags are always stored as lowercase
      tags: data.tags ? data.tags.map(tag => tag.toLowerCase()) : [],
    };

    const newEventRef = await addDoc(eventCollection, {
      ...processedData,
      attendeesCount: 1, // Start with the host as an attendee
      likesCount: 0,
      popularityScore: 0,
      attendeeIds: [data.hostId], // The host is always an attendee
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newEventRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Failed to create event.");
  }
}

export async function updateEvent(eventId: string, partial: Partial<Omit<Event, 'id'>>): Promise<void> {
  try {
    const eventRef = getEventDocRef(eventId);
    const processedPartial = { ...partial };

    // If tags are being updated, ensure they are stored as lowercase
    if (processedPartial.tags) {
      processedPartial.tags = processedPartial.tags.map(tag => tag.toLowerCase());
    }

    await updateDoc(eventRef, {
      ...processedPartial,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error("Failed to update event.");
  }
}

export async function getEventById(eventId: string): Promise<Event | null> {
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

// --- Real-time Listeners ---

export function listenToEvent(
  eventId: string,
  callback: (event: Event | null) => void
): () => void {
  const eventRef = getEventDocRef(eventId);
  const unsubscribe = onSnapshot(eventRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(eventFromDoc(docSnap as QueryDocumentSnapshot<DocumentData>));
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error listening to event:", error);
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
  // Can't recommend events if we don't know user interests
  if (!interests || interests.length === 0) {
    callback([]);
    return () => {}; // Return a no-op unsubscribe function
  }

  // Normalize interests to lowercase for case-insensitive matching
  const lowerCaseInterests = interests.map(interest => interest.toLowerCase());

  const now = new Date();
  const q = query(
    eventCollection,
    where('status', '==', 'published'),
    where('visibility', '==', 'public'),
    where('startTime', '>=', now),
    where('tags', 'array-contains-any', lowerCaseInterests),
    orderBy('startTime', 'asc'),
    limit(10) // Get a few more than we need to need to allow for client-side filtering
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs
      .map(doc => eventFromDoc(doc))
      // Filter out events the user is already hosting or attending
      .filter(event => !event.attendeeIds.includes(userId));

    callback(events.slice(0, 5)); // Return the top 5 after filtering
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

// --- Seeding Function (for development only) ---

export async function seedSampleEventsForUser(userId: string, userName: string, userAvatar?: string): Promise<void> {
  console.log(`Seeding events for user ${userId} (${userName})...`);

  const eventsToCreate = [
    // Event 1: Host
    {
      title: 'Poker Night & Chill',
      subtitle: 'bring your own deck',
      description: 'Weekly poker night. All skill levels welcome. We will have snacks and drinks.',
      hostId: userId,
      hostName: userName,
      hostAvatarUrl: userAvatar,
      coverImageUrl: 'https://source.unsplash.com/800x600/?poker',
      visibility: 'buds',
      status: 'published',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endTime: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000)), // 4 hours long
      location: { type: 'physical', address: '123 Main St', city: 'Brooklyn' },
      tags: ['poker', 'games', 'chill'],
      attendeeIds: [userId]
    },
    // Event 2: Attending
    {
      title: 'Housewarming Party',
      description: 'Come celebrate my new place!',
      hostId: 'some-friend-id-123',
      hostName: 'Jane Doe',
      coverImageUrl: 'https://source.unsplash.com/800x600/?party',
      visibility: 'public',
      status: 'published',
      startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endTime: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000) + (6 * 60 * 60 * 1000)),
      location: { type: 'physical', address: '456 Other Ave', city: 'Manhattan' },
      tags: ['party', 'housewarming'],
      attendeeIds: [userId, 'some-friend-id-123']
    },
    // Event 3: Attending
    {
        title: 'Brunch Squad',
        subtitle: 'bottomless mimosas!',
        description: 'Getting together for our monthly brunch crawl. This time we are hitting up "The Sunny Spot".',
        hostId: 'another-friend-456',
        hostName: 'Carlos Ramirez',
        coverImageUrl: 'https://source.unsplash.com/800x600/?brunch',
        visibility: 'public',
        status: 'published',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endTime: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)),
        location: { type: 'physical', city: 'Brooklyn' },
        tags: ['brunch', 'food', 'weekend'],
        attendeeIds: [userId, 'another-friend-456', 'some-friend-id-123']
    },
  ];

  for (const eventData of eventsToCreate) {
    try {
        // @ts-ignore
      await createEvent(eventData);
    } catch (e) {
      console.error("Error creating seed event", e);
    }
  }

  console.log('Event seeding complete.');
}
