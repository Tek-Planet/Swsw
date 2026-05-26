import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Calendar, MapPin, Users, ShieldCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAdminEvents } from '@/hooks/useAdminData';
import { useAllEventBookingsCounts } from '@/hooks/useEventBookings';
import { useEventMutations } from '@/hooks/useEventMutations';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAdminContext } from '@/hooks/useAdminContext';
import { formatEventDate } from '@/lib/dateUtils';

const Events = () => {
  const navigate = useNavigate();
  const { isFullAdmin } = useAdminContext();
  const { events, loading } = useAdminEvents();
  const { deleteEvent } = useEventMutations();
  const eventIds = events.map(e => e.id);
  const { counts: bookingCounts } = useAllEventBookingsCounts(eventIds);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-500/10 text-green-500 border-green-500/20',
      draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
      completed: 'bg-muted text-muted-foreground border-border',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    await deleteEvent(eventId);
    // Events will refresh automatically via the hook
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Events</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your events and view bookings.</p>
        </div>
        {isFullAdmin && (
          <Button className="gap-2 w-full sm:w-auto" onClick={() => navigate('/admin/events/create')}>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-muted border-border"
        />
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading events..." />
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search.' : (isFullAdmin ? 'Create your first event to get started.' : 'You have not been assigned to any events yet.')}
            </p>
            {isFullAdmin && (
              <Button className="gap-2" onClick={() => navigate('/admin/events/create')}>
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="bg-card border-border hover:border-primary/30 transition-colors overflow-hidden">
              <CardContent className="p-0">
                {/* Mobile Layout */}
                <div className="block lg:hidden">
                  {/* Image */}
                  <div className="w-full h-40 relative">
                    <img
                      src={event.coverImageUrl || '/placeholder.svg'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {event.isInviteOnly && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 bg-background/80 backdrop-blur-sm">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Invite Only
                        </Badge>
                      )}
                      <Badge variant="outline" className={`${getStatusBadge(event.status)} bg-background/80 backdrop-blur-sm`}>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/admin/events/${event.id}`} className="text-base font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                        {event.title}
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0 -mr-2 -mt-1 h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/events/${event.id}`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {isFullAdmin && (
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/events/${event.id}/edit`} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/events/${event.id}/bookings`} className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              View Bookings
                            </Link>
                          </DropdownMenuItem>
                          {event.isInviteOnly && (
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/events/${event.id}/applications`} className="flex items-center gap-2">
                                <ClipboardList className="h-4 w-4" />
                                Applications
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {isFullAdmin && (
                            <DropdownMenuItem 
                              className="text-destructive flex items-center gap-2"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatEventDate(event.startTime, event.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{event.location?.city || 'TBA'}</span>
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{bookingCounts[event.id] || 0}</span>
                        <span className="text-xs text-muted-foreground">bookings</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Capacity: {event.maxAttendees || '∞'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:flex p-4 gap-4">
                  {/* Event Image */}
                  <div className="w-48 h-32 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={event.coverImageUrl || '/placeholder.svg'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Link to={`/admin/events/${event.id}`} className="text-lg font-semibold text-foreground truncate hover:text-primary transition-colors">
                            {event.title}
                          </Link>
                          <Badge variant="outline" className={getStatusBadge(event.status)}>
                            {event.status}
                          </Badge>
                          {event.isInviteOnly && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Invite Only
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatEventDate(event.startTime, event.endTime)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location?.city || 'TBA'}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/events/${event.id}`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {isFullAdmin && (
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/events/${event.id}/edit`} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/events/${event.id}/bookings`} className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              View Bookings
                            </Link>
                          </DropdownMenuItem>
                          {event.isInviteOnly && (
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/events/${event.id}/applications`} className="flex items-center gap-2">
                                <ClipboardList className="h-4 w-4" />
                                Applications
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {isFullAdmin && (
                            <DropdownMenuItem 
                              className="text-destructive flex items-center gap-2"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Bookings</p>
                        <p className="text-lg font-semibold text-foreground">{bookingCounts[event.id] || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capacity</p>
                        <p className="text-lg font-semibold text-foreground">{event.maxAttendees || '∞'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
