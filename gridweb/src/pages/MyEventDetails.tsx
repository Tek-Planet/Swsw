import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Tag, Ticket, Clock, Camera } from 'lucide-react';
import { doc, getDoc, collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClientPhotoGrid from '@/components/ClientPhotoGrid';
import { Event, TicketTier, Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatEventDate, formatTime } from '@/lib/dateUtils';
import { useEventAlbums, useEventPhotos, ensureDefaultAlbum } from '@/hooks/useEventPhotos';
import { motion } from 'framer-motion';

const MyEventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('grid_return_url', `/my-events/${eventId}`);
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      if (!eventId) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        // Fetch event
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
          setError('Event not found');
          setLoading(false);
          return;
        }

        const eventData = eventSnap.data();
        setEvent({
          id: eventSnap.id,
          ...eventData,
          startTime: eventData.startTime?.toDate?.() || new Date(eventData.startTime),
          endTime: eventData.endTime?.toDate?.() || (eventData.endTime ? new Date(eventData.endTime) : undefined),
          createdAt: eventData.createdAt?.toDate?.() || undefined,
          updatedAt: eventData.updatedAt?.toDate?.() || undefined,
        } as Event);

        // Fetch ticket tiers
        const tiersRef = collection(db, 'events', eventId, 'ticketTiers');
        const tiersQuery = query(tiersRef, orderBy('sortOrder', 'asc'));
        const tiersSnap = await getDocs(tiersQuery);
        setTicketTiers(tiersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as TicketTier[]);

        // Fetch user's orders for this event
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(
          ordersRef,
          where('userId', '==', user.uid),
          where('eventId', '==', eventId),
          where('status', '==', 'paid')
        );
        const ordersSnap = await getDocs(ordersQuery);
        setMyOrders(ordersSnap.docs.map((d) => ({ orderId: d.id, ...d.data() })) as Order[]);

        // Initialize default album for photos
        try {
          const albumId = await ensureDefaultAlbum(eventId);
          setSelectedAlbumId(albumId);
        } catch {
          // Photos section will just not show if album fails
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, user, navigate]);

  // Photo hooks
  const {
    data: photosData,
    isLoading: photosLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useEventPhotos(eventId || '', selectedAlbumId);

  const photos = useMemo(() => {
    if (!photosData?.pages) return [];
    return photosData.pages.flatMap(page => page.photos);
  }, [photosData]);

  const formatCurrency = (amount: number, currency?: string) => {
    const curr = currency || 'INR';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalTickets = myOrders.reduce(
    (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="Loading event..." />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="pt-28 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/my-events')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Error</h1>
                <p className="text-muted-foreground">{error || 'Event not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/my-events')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                  {event.title}
                </h1>
                {event.subtitle && (
                  <p className="text-muted-foreground mt-1">{event.subtitle}</p>
                )}
              </div>
            </div>

            {/* Cover Image */}
            {event.coverImageUrl && (
              <div className="w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                <img
                  src={event.coverImageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* My Tickets Summary */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalTickets}</p>
                      <p className="text-xs text-muted-foreground">My Tickets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Calendar className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {myOrders.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Event Details */}
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        {formatEventDate(event.startTime, event.endTime)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(event.startTime)}
                        {event.endTime && ` - ${formatTime(event.endTime)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        {event.location?.address || 'TBA'}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.location?.city}</p>
                    </div>
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="bg-muted">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h4 className="font-medium text-foreground mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* My Orders */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">My Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {myOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders found.</p>
                  ) : (
                    <div className="space-y-3">
                      {myOrders.map((order) => (
                        <Link
                          key={order.orderId}
                          to={`/my-tickets/${order.orderId}`}
                          className="block p-3 rounded-lg border border-border bg-muted/50 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-muted-foreground">
                              #{order.orderId.slice(-8).toUpperCase()}
                            </span>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                              Confirmed
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-foreground">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatCurrency(item.unitPrice * item.quantity, order.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-foreground">Total</span>
                            <span className="text-foreground">
                              {formatCurrency(order.total || order.subtotal, order.currency)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Event Photos */}
            {selectedAlbumId && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Event Photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClientPhotoGrid
                    photos={photos}
                    isLoading={photosLoading}
                    isFetchingNextPage={isFetchingNextPage}
                    hasNextPage={!!hasNextPage}
                    onLoadMore={() => fetchNextPage()}
                  />
                </CardContent>
              </Card>
            )}

            {/* Buy More Tickets */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-semibold text-foreground">Need more tickets?</h3>
                  <p className="text-sm text-muted-foreground">Purchase additional tickets for this event.</p>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/events/${event.id}`}>
                    <Ticket className="h-4 w-4 mr-2" />
                    Buy Tickets
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MyEventDetails;
