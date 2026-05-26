import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';

export interface EventNotification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  sentAt: Timestamp;
}

export const useEventNotifications = (eventId: string | undefined) => {
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notificationsQuery = query(
      collection(db, 'event_notifications'),
      where('eventId', '==', eventId)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as EventNotification[];

        // Client-side sorting to avoid needing a composite index
        notifs.sort((a, b) => {
          const dateA = a.sentAt ? a.sentAt.toDate().getTime() : 0;
          const dateB = b.sentAt ? b.sentAt.toDate().getTime() : 0;
          return dateB - dateA;
        });

        setNotifications(notifs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching event notifications:', err);
        setError(err);
        toast.error('Failed to load notifications.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  const createNotification = async (title: string, message: string) => {
    if (!eventId) throw new Error('Event ID is not defined.');

    const promise = addDoc(collection(db, 'event_notifications'), {
      eventId,
      title: title.trim(),
      message: message.trim(),
      sentAt: serverTimestamp(),
    });

    toast.promise(promise, {
      loading: 'Sending notification...',
      success: 'Notification sent successfully!',
      error: 'Failed to send notification.',
    });

    // We await here to ensure the calling function can wait for completion
    await promise;
  };

  const deleteNotification = async (notificationId: string) => {
    if (!window.confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
        return;
    }
    
    const promise = deleteDoc(doc(db, 'event_notifications', notificationId));

    toast.promise(promise, {
      loading: 'Deleting notification...',
      success: 'Notification deleted successfully.',
      error: 'Failed to delete notification.',
    });

    await promise;
  };

  return { notifications, loading, error, createNotification, deleteNotification };
};