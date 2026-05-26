
import { useState, useEffect } from 'react';
import { listenToEvent } from '@/lib/services/eventService';
import { Event } from '@/types/event';

/**
 * A real-time hook to fetch a single event document from Firestore.
 * @param eventId The ID of the event to listen to.
 * @returns The event data, loading state, and any error.
 */
export const useEvent = (eventId: string | undefined) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setEvent(null);
      return;
    }

    setLoading(true);

    try {
      const unsubscribe = listenToEvent(eventId, (eventData) => {
        setEvent(eventData);
        setLoading(false);
      });

      // Cleanup subscription on component unmount
      return () => unsubscribe();
    } catch (e) {
      setError(e as Error);
      setLoading(false);
      console.error(`Error fetching event ${eventId}:`, e);
    }
  }, [eventId]);

  return { event, loading, error };
};
