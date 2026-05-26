import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TicketTier } from '@/types';

// Fallback ticket tiers
const FALLBACK_TIERS: TicketTier[] = [
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Standard entry with access to main floor',
    price: 999,
    currency: 'inr',
    type: 'ticket',
    isActive: true,
    sortOrder: 1,
    quantityTotal: 200,
    quantitySold: 45,
  },
  {
    id: 'general',
    name: 'General Admission',
    description: 'Standard entry with access to all areas',
    price: 1499,
    currency: 'inr',
    type: 'ticket',
    isActive: true,
    sortOrder: 2,
    quantityTotal: 300,
    quantitySold: 120,
  },
  {
    id: 'vip',
    name: 'VIP Experience',
    description: 'Premium seating, priority entry, complimentary drinks',
    price: 2999,
    currency: 'inr',
    type: 'ticket',
    isActive: true,
    sortOrder: 3,
    quantityTotal: 50,
    quantitySold: 15,
  },
  {
    id: 'table',
    name: 'Table Package (6 pax)',
    description: 'Reserved table, bottle service, dedicated host',
    price: 15000,
    currency: 'inr',
    type: 'ticket',
    isActive: true,
    sortOrder: 4,
    quantityTotal: 10,
    quantitySold: 3,
  },
];

export const useTicketTiers = (eventId: string) => {
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        // Use fallback for demo event
        if (eventId === 'grid-launch-party') {
          setTiers(FALLBACK_TIERS);
          setIsFallback(true);
          setLoading(false);
          return;
        }

        const tiersRef = collection(db, 'events', eventId, 'ticketTiers');
        const q = query(
          tiersRef,
          where('isActive', '==', true),
          orderBy('sortOrder', 'asc')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setTiers(FALLBACK_TIERS);
          setIsFallback(true);
        } else {
          const tiersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as TicketTier[];
          setTiers(tiersData);
          setIsFallback(false);
        }
      } catch (err) {
        console.error('Error fetching ticket tiers:', err);
        setTiers(FALLBACK_TIERS);
        setIsFallback(true);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchTiers();
    }
  }, [eventId]);

  return { tiers, loading, error, isFallback };
};
