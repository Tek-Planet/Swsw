import { useQuery } from "@tanstack/react-query";
import { collection, query, orderBy, getDocs, Timestamp, where, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, Event } from "@/types";
import { useAdminContext } from "./useAdminContext";

interface DashboardStats {
  totalBookings: number;
  paidBookings: number;
  totalRevenue: number;
  activeUsers: number;
}

// Fetch all orders for admin
const fetchAllOrders = async (): Promise<Order[]> => {
  const ordersRef = collection(db, "orders");
  const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    orderId: doc.id,
  })) as Order[];
};

// Fetch orders for specific events only
const fetchOrdersForEvents = async (eventIds: string[]): Promise<Order[]> => {
  if (eventIds.length === 0) return [];
  
  const ordersRef = collection(db, "orders");
  // Firestore 'in' queries are limited to 30 items, so we need to batch
  const batches: Order[] = [];
  
  for (let i = 0; i < eventIds.length; i += 30) {
    const batchEventIds = eventIds.slice(i, i + 30);
    const ordersQuery = query(
      ordersRef, 
      where("eventId", "in", batchEventIds)
    );
    const snapshot = await getDocs(ordersQuery);
    
    const batchOrders = snapshot.docs.map((doc) => ({
      ...doc.data(),
      orderId: doc.id,
    })) as Order[];
    
    batches.push(...batchOrders);
  }
  
  // Sort combined results by createdAt
  return batches.sort((a, b) => {
    const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
    const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
    return dateB - dateA;
  });
};

// Fetch all events for admin (including past and unpublished)
const fetchAllEventsForAdmin = async (): Promise<Event[]> => {
  const eventsRef = collection(db, "events");
  const eventsQuery = query(eventsRef, orderBy("startTime", "desc"));
  const snapshot = await getDocs(eventsQuery);

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

// Fetch specific events by IDs
const fetchEventsForAdmin = async (eventIds: string[]): Promise<Event[]> => {
  if (eventIds.length === 0) return [];
  
  const eventsRef = collection(db, "events");
  const batches: Event[] = [];
  
  // Firestore 'in' queries limited to 30 items
  for (let i = 0; i < eventIds.length; i += 30) {
    const batchEventIds = eventIds.slice(i, i + 30);
    const eventsQuery = query(
      eventsRef, 
      where(documentId(), "in", batchEventIds)
    );
    const snapshot = await getDocs(eventsQuery);
    
    const batchEvents = snapshot.docs.map((doc) => {
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
    
    batches.push(...batchEvents);
  }
  
  // Sort by startTime desc
  return batches.sort((a, b) => {
    const dateA = a.startTime instanceof Date ? a.startTime.getTime() : 0;
    const dateB = b.startTime instanceof Date ? b.startTime.getTime() : 0;
    return dateB - dateA;
  });
};

// Calculate dashboard stats from orders
const calculateStats = (orders: Order[]): DashboardStats => {
  let totalBookings = 0;
  let paidBookings = 0;
  let totalRevenue = 0;
  const uniqueUsers = new Set<string>();

  orders.forEach((order) => {
    totalBookings++;

    if (order.userId) {
      uniqueUsers.add(order.userId);
    }

    if (order.status === "paid") {
      paidBookings++;
      totalRevenue += order.total || order.subtotal || 0;
    }
  });

  return {
    totalBookings,
    paidBookings,
    totalRevenue,
    activeUsers: uniqueUsers.size,
  };
};

/**
 * Hook for fetching admin orders with caching
 * - Full admins see all orders
 * - Event admins only see orders for their assigned events
 */
export const useAdminOrders = () => {
  const { isFullAdmin, isEventAdmin, assignedEventIds, loading: contextLoading } = useAdminContext();

  const { data: orders = [], isLoading: queryLoading, error, refetch } = useQuery({
    queryKey: ["admin-orders", isFullAdmin, assignedEventIds],
    queryFn: async () => {
      if (isFullAdmin) {
        return fetchAllOrders();
      }
      if (isEventAdmin && assignedEventIds.length > 0) {
        return fetchOrdersForEvents(assignedEventIds);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !contextLoading && (isFullAdmin || isEventAdmin),
  });

  return { orders, loading: contextLoading || queryLoading, error, refetch };
};

/**
 * Hook for fetching events for admin pages with caching
 * - Full admins see all events
 * - Event admins only see their assigned events
 */
export const useAdminEvents = () => {
  const { isFullAdmin, isEventAdmin, assignedEventIds, loading: contextLoading } = useAdminContext();

  const { data: events = [], isLoading: queryLoading, error } = useQuery({
    queryKey: ["admin-events", isFullAdmin, assignedEventIds],
    queryFn: async () => {
      if (isFullAdmin) {
        return fetchAllEventsForAdmin();
      }
      if (isEventAdmin && assignedEventIds.length > 0) {
        return fetchEventsForAdmin(assignedEventIds);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !contextLoading && (isFullAdmin || isEventAdmin),
  });

  return { events, loading: contextLoading || queryLoading, error };
};

/**
 * Hook for dashboard stats - derives from admin orders
 */
export const useDashboardStats = () => {
  const { orders, loading, error } = useAdminOrders();

  const stats = calculateStats(orders);

  return { stats, loading, error };
};
