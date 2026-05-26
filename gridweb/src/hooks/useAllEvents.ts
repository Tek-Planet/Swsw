import { useQuery } from "@tanstack/react-query";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Event } from "@/types";

const fetchAllEvents = async (): Promise<Event[]> => {
  const eventsRef = collection(db, "events");
  const q = query(eventsRef, orderBy("startTime", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: data.startTime?.toDate?.() || new Date(data.startTime),
      endTime: data.endTime?.toDate?.() || (data.endTime ? new Date(data.endTime) : undefined),
      createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : undefined),
      updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : undefined),
    };
  }) as Event[];
};

/**
 * Hook for admin use - fetches ALL events without any filters
 * (includes past, unpublished, draft, cancelled events)
 * Uses React Query for caching across page navigations
 */
export const useAllEvents = () => {
  const { data: events = [], isLoading: loading, error } = useQuery({
    queryKey: ["admin-all-events"],
    queryFn: fetchAllEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { events, loading, error };
};
