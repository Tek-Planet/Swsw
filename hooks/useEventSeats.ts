
import { useState, useEffect } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { Seat } from '../types/movie';

export const useEventSeats = (eventId?: string) => {
  const [seats, setSeats] = useState<Record<string, Seat>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setSeats({});
      setLoading(false);
      return;
    }

    const seatsCollectionRef = collection(db, 'events', eventId, 'seats');

    // onSnapshot listens for real-time updates
    const unsubscribe = onSnapshot(
      seatsCollectionRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const newSeats: Record<string, Seat> = {};
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<Seat, 'id'>;
          newSeats[doc.id] = { id: doc.id, ...data };
        });
        setSeats(newSeats);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching real-time seats:', error);
        setSeats({});
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [eventId]);

  return { seats, loading };
};
