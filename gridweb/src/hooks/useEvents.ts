import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Event } from "@/types";

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, "events");
        const now = new Date();
        const q = query(
          eventsRef,
          where("status", "==", "published"),
          where("startTime", ">=", now),
          orderBy("startTime", "asc"),
        );
        const snapshot = await getDocs(q);

        const eventsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            eventType: data.eventType || 'regular',
            startTime: data.startTime?.toDate?.() || new Date(data.startTime),
            endTime: data.endTime?.toDate?.() || (data.endTime ? new Date(data.endTime) : undefined),
            createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : undefined),
            updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : undefined),
          };
        }) as Event[];
        setEvents(eventsData);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};

export const useEvent = (eventId: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventRef = doc(db, "events", eventId);
        const snapshot = await getDoc(eventRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setEvent({
            id: snapshot.id,
            ...data,
            eventType: data.eventType || 'regular',
            startTime: data.startTime?.toDate?.() || new Date(data.startTime),
            endTime: data.endTime?.toDate?.() || (data.endTime ? new Date(data.endTime) : undefined),
            showtime: data.showtime?.toDate?.() || (data.showtime ? new Date(data.showtime) : undefined),
            createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : undefined),
            updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : undefined),
          } as Event);
        } else {
          setEvent(null);
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return { event, loading, error };
};
