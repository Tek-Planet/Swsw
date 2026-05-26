
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { Venue } from '../types/movie';

export const useVenue = (venueId?: string) => {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) {
      setVenue(null);
      setLoading(false);
      return;
    }

    const fetchVenue = async () => {
      setLoading(true);
      try {
        const venueDocRef = doc(db, 'venues', venueId);
        const venueDocSnap = await getDoc(venueDocRef);

        if (venueDocSnap.exists()) {
          const data = venueDocSnap.data() as Omit<Venue, 'id'>;
          setVenue({ id: venueDocSnap.id, ...data });
        } else {
          console.warn(`Venue with id ${venueId} not found.`);
          setVenue(null);
        }
      } catch (error) {
        console.error('Error fetching venue:', error);
        setVenue(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [venueId]);

  return { venue, loading };
};
