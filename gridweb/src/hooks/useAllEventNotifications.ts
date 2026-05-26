import { useState, useEffect, useCallback } from "react";
import { collection, query, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface EventNotification {
  id: string;
  eventId: string;
  message: string;
  timestamp: Timestamp;
  createdBy: string;
}

export const useAllEventNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "event_notifications"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedNotifications = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventNotification[];
      setNotifications(fetchedNotifications);
    } catch (err) {
      console.log(err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, loading, error, refetch: fetchNotifications };
};