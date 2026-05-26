import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Seat } from '@/types';

/**
 * Realtime subscription to event seats. Returns a map keyed by seatId.
 */
export const useEventSeats = (eventId?: string) => {
  const [seats, setSeats] = useState<Record<string, Seat>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setSeats({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = collection(db, 'events', eventId, 'seats');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const next: Record<string, Seat> = {};
        snap.forEach((d) => {
          const data = d.data() as any;
          next[d.id] = {
            id: d.id,
            rowLabel: data.rowLabel,
            seatLabel: data.seatLabel,
            type: data.type ?? 'normal',
            price: Number(data.price ?? 0),
            status: data.status ?? 'available',
            heldBy: data.heldBy ?? null,
            heldUntil: data.heldUntil?.toDate?.() ?? null,
            orderId: data.orderId ?? null,
            userId: data.userId ?? null,
          };
        });
        setSeats(next);
        setLoading(false);
      },
      (err) => {
        console.error('useEventSeats error', err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [eventId]);

  return { seats, loading };
};
