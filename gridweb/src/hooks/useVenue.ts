import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Venue } from '@/types';

export const useVenue = (venueId?: string) => {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!venueId) {
      setVenue(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'venues', venueId));
        if (cancelled) return;
        if (snap.exists()) {
          setVenue({ id: snap.id, ...(snap.data() as Omit<Venue, 'id'>) });
        } else {
          setVenue(null);
        }
      } catch (err) {
        console.error('useVenue error', err);
        if (!cancelled) setVenue(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  return { venue, loading };
};
