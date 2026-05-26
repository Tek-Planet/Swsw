import { Calendar, Users, DollarSign, TrendingUp, CalendarClock, ScanLine, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardData } from '@/hooks/useDashboardData';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const currencySymbol = (c: string) => (c === 'USD' ? '$' : c === 'HKD' ? 'HK$' : '₹');

const StatCard = ({
  title, value, icon: Icon, subtitle, loading, accent
}: {
  title: string; value: string; icon: React.ElementType;
  subtitle?: string; loading?: boolean; accent?: boolean;
}) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <Card className={`bg-card border-border ${accent ? 'ring-1 ring-primary/20' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${accent ? 'bg-primary/10' : 'bg-muted'}`}>
          <Icon className={`h-4 w-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold font-display text-foreground">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-medium text-foreground">
          {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : `${p.value} bookings`}
        </p>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const data = useDashboardData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time overview of your events & bookings</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Events" value={data.totalEvents.toString()} icon={Calendar} loading={data.loading} />
        <StatCard title="Upcoming" value={data.upcomingEvents.toString()} icon={CalendarClock} loading={data.loading} />
        <StatCard title="Paid Bookings" value={data.paidBookings.toString()} icon={Users} loading={data.loading} accent />
        <StatCard title="Revenue" value={`₹${data.totalRevenue.toLocaleString()}`} icon={DollarSign} loading={data.loading} accent />
        <StatCard title="Avg. Order" value={`₹${Math.round(data.avgOrderValue).toLocaleString()}`} icon={BarChart3} loading={data.loading} />
        <StatCard title="Check-in Rate" value={`${data.checkInRate}%`} icon={ScanLine} loading={data.loading} subtitle={data.checkInRate > 0 ? 'of tickets scanned' : 'No scan data'} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.revenueChart}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(199, 89%, 48%)" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ticket Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Ticket Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : data.ticketBreakdown.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No ticket data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.ticketBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                    {data.ticketBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span className="text-muted-foreground">{v}</span>} />
                  <Tooltip formatter={(v: number) => [v, 'Tickets']} contentStyle={{ background: 'hsl(222, 47%, 8%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Events */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Top Events by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : data.topEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No event data yet</p>
            ) : (
              data.topEvents.map((event, i) => {
                const maxRev = data.topEvents[0]?.revenue || 1;
                return (
                  <Link to={`/admin/events/${event.id}`} key={event.id} className="block group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                        <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{event.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">{event.bookings} bookings</span>
                        <span className="text-sm font-semibold text-foreground">₹{event.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <Progress value={(event.revenue / maxRev) * 100} className="h-1.5" />
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-foreground">Recent Bookings</CardTitle>
            <Link to="/admin/bookings" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)
            ) : data.recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentBookings.map((booking) => (
                  <div key={booking.orderId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{booking.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.items} ticket{booking.items !== 1 ? 's' : ''} · {formatDistanceToNow(booking.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant={booking.status === 'paid' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                        {booking.status}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">
                        {currencySymbol(booking.currency)}{booking.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
