import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useEventBookingsCount = (eventId: string) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || eventId === 'grid-launch-party') {
      setCount(0);
      setLoading(false);
      return;
    }

    const fetchCount = async () => {
      try {
        // Query top-level orders collection filtered by eventId and status
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('eventId', '==', eventId),
          where('status', '==', 'paid')
        );
        const snapshot = await getDocs(q);
        
        // Count total tickets from all orders
        let totalTickets = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.items) {
            totalTickets += data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
          }
        });
        
        setCount(totalTickets);
      } catch (err) {
        console.error('Error fetching bookings count:', err);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [eventId]);

  return { count, loading };
};

export const useAllEventBookingsCounts = (eventIds: string[]) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchAllCounts = async () => {
      try {
        const countsMap: Record<string, number> = {};
        
        await Promise.all(
          eventIds.map(async (eventId) => {
            if (eventId === 'grid-launch-party') {
              countsMap[eventId] = 0;
              return;
            }
            
            // Query top-level orders collection filtered by eventId and status
            const ordersRef = collection(db, 'orders');
            const q = query(
              ordersRef,
              where('eventId', '==', eventId),
              where('status', '==', 'paid')
            );
            const snapshot = await getDocs(q);
            
            let totalTickets = 0;
            snapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.items) {
                totalTickets += data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
              }
            });
            
            countsMap[eventId] = totalTickets;
          })
        );
        
        setCounts(countsMap);
      } catch (err) {
        console.error('Error fetching all bookings counts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCounts();
  }, [eventIds.join(',')]);

  return { counts, loading };
};
