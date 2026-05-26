import { useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import { useAdminOrders, useAdminEvents } from "./useAdminData";
import { Order, Event } from "@/types";
import { format, subDays, startOfDay, isAfter } from "date-fns";

interface RevenueDataPoint {
  date: string;
  revenue: number;
  bookings: number;
}

interface TopEvent {
  id: string;
  title: string;
  bookings: number;
  revenue: number;
  maxAttendees?: number;
}

interface TicketBreakdown {
  name: string;
  value: number;
  fill: string;
}

interface RecentBooking {
  orderId: string;
  eventTitle: string;
  amount: number;
  currency: string;
  createdAt: Date;
  status: string;
  items: number;
}

export interface DashboardData {
  // Stat cards
  totalEvents: number;
  upcomingEvents: number;
  paidBookings: number;
  totalRevenue: number;
  activeUsers: number;
  avgOrderValue: number;
  checkInRate: number;
  // Charts
  revenueChart: RevenueDataPoint[];
  topEvents: TopEvent[];
  ticketBreakdown: TicketBreakdown[];
  recentBookings: RecentBooking[];
  // Loading
  loading: boolean;
}

const TIER_COLORS = [
  "hsl(199, 89%, 48%)",   // primary blue
  "hsl(260, 60%, 55%)",   // secondary purple
  "hsl(142, 71%, 45%)",   // green
  "hsl(38, 92%, 50%)",    // amber
  "hsl(340, 75%, 55%)",   // pink
  "hsl(180, 60%, 45%)",   // teal
];

export const useDashboardData = (): DashboardData => {
  const { orders, loading: ordersLoading } = useAdminOrders();
  const { events, loading: eventsLoading } = useAdminEvents();

  const loading = ordersLoading || eventsLoading;

  return useMemo(() => {
    const now = new Date();
    const paidOrders = orders.filter((o) => o.status === "paid");
    const uniqueUsers = new Set(orders.map((o) => o.userId).filter(Boolean));
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || o.subtotal || 0), 0);
    const upcomingEvents = events.filter((e) => isAfter(e.startTime, now)).length;
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // Check-in rate: attendeesCount / total paid ticket qty
    const totalTicketsSold = paidOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const totalCheckedIn = events.reduce((sum, e) => sum + (e.attendeesCount || 0), 0);
    const checkInRate = totalTicketsSold > 0 ? Math.round((totalCheckedIn / totalTicketsSold) * 100) : 0;

    // Revenue chart - last 30 days
    const revenueMap = new Map<string, { revenue: number; bookings: number }>();
    for (let i = 29; i >= 0; i--) {
      const day = format(subDays(now, i), "MMM dd");
      revenueMap.set(day, { revenue: 0, bookings: 0 });
    }
    paidOrders.forEach((order) => {
      const ts = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date();
      const dayStart = startOfDay(ts);
      if (isAfter(dayStart, subDays(now, 30))) {
        const key = format(ts, "MMM dd");
        const existing = revenueMap.get(key);
        if (existing) {
          existing.revenue += order.total || order.subtotal || 0;
          existing.bookings += 1;
        }
      }
    });
    const revenueChart: RevenueDataPoint[] = Array.from(revenueMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Top events by revenue
    const eventRevenueMap = new Map<string, { bookings: number; revenue: number }>();
    paidOrders.forEach((order) => {
      const existing = eventRevenueMap.get(order.eventId) || { bookings: 0, revenue: 0 };
      existing.bookings += 1;
      existing.revenue += order.total || order.subtotal || 0;
      eventRevenueMap.set(order.eventId, existing);
    });
    const topEvents: TopEvent[] = events
      .map((e) => ({
        id: e.id,
        title: e.title,
        bookings: eventRevenueMap.get(e.id)?.bookings || 0,
        revenue: eventRevenueMap.get(e.id)?.revenue || 0,
        maxAttendees: e.maxAttendees,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Ticket breakdown by tier type
    const tierMap = new Map<string, number>();
    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const name = item.name || item.type;
        tierMap.set(name, (tierMap.get(name) || 0) + item.quantity);
      });
    });
    const ticketBreakdown: TicketBreakdown[] = Array.from(tierMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        fill: TIER_COLORS[i % TIER_COLORS.length],
      }));

    // Recent bookings
    const recentBookings: RecentBooking[] = orders.slice(0, 8).map((order) => ({
      orderId: order.orderId,
      eventTitle: order.eventTitle || "Unknown Event",
      amount: order.total || order.subtotal || 0,
      currency: order.currency || "INR",
      createdAt: order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(),
      status: order.status,
      items: order.items.reduce((s, i) => s + i.quantity, 0),
    }));

    return {
      totalEvents: events.length,
      upcomingEvents,
      paidBookings: paidOrders.length,
      totalRevenue,
      activeUsers: uniqueUsers.size,
      avgOrderValue,
      checkInRate,
      revenueChart,
      topEvents,
      ticketBreakdown,
      recentBookings,
      loading,
    };
  }, [orders, events, loading]);
};
