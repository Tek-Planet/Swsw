
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Eye, Calendar, MapPin, Users, Clock, Tag, DollarSign, Ticket, ExternalLink, Camera, Send, ShieldCheck, ClipboardList, Mail, Film } from 'lucide-react';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Event, TicketTier } from '@/types';
import { useEventBookingsCount } from '@/hooks/useEventBookings';
import { formatEventDate, formatTime } from '@/lib/dateUtils';

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { count: bookingsCount } = useEventBookingsCount(eventId || '');

  useEffect(() => {
    const fetchEventData = async () => {
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

        const tiersData = tiersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TicketTier[];

        setTicketTiers(tiersData);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-500/10 text-green-500 border-green-500/20',
      draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
      completed: 'bg-muted text-muted-foreground border-border',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const getVisibilityBadge = (visibility?: string) => {
    const styles = {
      public: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      private: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      unlisted: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };
    return styles[(visibility || 'public') as keyof typeof styles] || styles.public;
  };

  const formatCurrency = (amount: number, currency?: string) => {
    const curr = currency || 'INR';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading event..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/events')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Error</h1>
            <p className="text-muted-foreground">{error || 'Event not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/events')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {event.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getStatusBadge(event.status)}>
                {event.status}
              </Badge>
              <Badge variant="outline" className={getVisibilityBadge(event.visibility)}>
                {event.visibility || 'public'}
              </Badge>
              {event.eventType === 'movie' && (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  <Film className="w-3 h-3 mr-1" />
                  Movie
                </Badge>
              )}
              {event.isInviteOnly && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Invite Only
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 ml-12 sm:ml-0">
          <Button variant="outline" asChild>
            <Link to={`/events/${event.id}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Page
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/admin/events/${event.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Link>
          </Button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{bookingsCount}</p>
                <p className="text-xs text-muted-foreground">Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{event.maxAttendees || '∞'}</p>
                <p className="text-xs text-muted-foreground">Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Ticket className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{ticketTiers.length}</p>
                <p className="text-xs text-muted-foreground">Ticket Tiers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <DollarSign className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{event.bookingFeePercent || 0}%</p>
                <p className="text-xs text-muted-foreground">Booking Fee</p>
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
                <p className="font-medium text-foreground">{formatEventDate(event.startTime, event.endTime)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(event.startTime)}
                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{event.location?.address || 'TBA'}</p>
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
            
            {event.subtitle && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium text-foreground mb-2">Subtitle</h4>
                  <p className="text-sm text-muted-foreground">{event.subtitle}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ticket Tiers */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Ticket Tiers</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/admin/events/${event.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ticketTiers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ticket tiers configured.</p>
            ) : (
              <div className="space-y-3">
                {ticketTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`p-3 rounded-lg border ${
                      tier.isActive ? 'bg-muted/50 border-border' : 'bg-muted/20 border-border/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{tier.name}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {tier.type}
                          </Badge>
                          {!tier.isActive && (
                            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {tier.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {tier.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(tier.price, tier.currency)}
                        </p>
                        {tier.quantityTotal && (
                          <p className="text-xs text-muted-foreground">
                            {tier.quantitySold || 0}/{tier.quantityTotal} sold
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {event.eventType === 'movie' && (
                <Button variant="outline" asChild>
                    <Link to={`/admin/events/${event.id}/seats`}>
                        <Film className="h-4 w-4 mr-2" />
                        View Seat Map
                    </Link>
                </Button>
            )}
            <Button variant="outline" asChild>
                <Link to={`/admin/events/${event.id}/notifications`}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                </Link>
             </Button>
            <Button variant="outline" asChild>
              <Link to={`/admin/events/${event.id}/email`}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Link>
            </Button>
            {event.isInviteOnly && (
              <Button variant="outline" asChild>
                <Link to={`/admin/events/${event.id}/applications`}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Review Applications
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to={`/admin/events/${event.id}/photos`}>
                <Camera className="h-4 w-4 mr-2" />
                Manage Photos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/admin/bookings?eventId=${event.id}`}>
                <Users className="h-4 w-4 mr-2" />
                View Bookings
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/scanner">
                <Eye className="h-4 w-4 mr-2" />
                Open Scanner
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetails;
