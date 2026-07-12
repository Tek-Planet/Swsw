import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TicketTier } from '@/types';

export const useTicketTiers = (eventId: string) => {
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const tiersRef = collection(db, 'events', eventId, 'ticketTiers');
        const q = query(
          tiersRef,
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setTiers([]);
        } else {
          const tiersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as TicketTier[];
          setTiers(tiersData);
        }
      } catch (err) {
        console.error('Error fetching ticket tiers:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchTiers();
    }
  }, [eventId]);

  return { tiers, loading, error };
};
