import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  readAt?: Timestamp;
  link?: string;
  icon?: string;
}

export const useUserNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    setLoading(true);
    const notificationsRef = collection(db, 'notifications', user.uid, 'user_notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedNotifications = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserNotification[];
        setNotifications(fetchedNotifications);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user notifications:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.uid || !notificationId) {
        console.error('User ID or Notification ID is missing.');
        return;
      }
      const notificationRef = doc(db, 'notifications', user.uid, 'user_notifications', notificationId);
      try {
        await updateDoc(notificationRef, {
          read: true,
          readAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    [user?.uid]
  );

  return { notifications, loading, error, markNotificationAsRead };
};
