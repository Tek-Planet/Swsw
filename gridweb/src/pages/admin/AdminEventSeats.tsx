import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Film } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import SeatMap from "@/components/SeatMap";
import { Button } from "@/components/ui/button";
import { useEvent } from "@/hooks/useEvents";
import { useVenue } from "@/hooks/useVenue";
import { useEventSeats } from "@/hooks/useEventSeats";

const AdminEventSeats = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { event, loading: eventLoading } = useEvent(eventId || "");
  const isMovie = event?.eventType === 'movie';
  const { venue, loading: venueLoading } = useVenue(isMovie ? event?.venueId : undefined);
  const { seats: liveSeats, loading: seatsLoading } = useEventSeats(isMovie ? eventId : undefined);

  if (eventLoading || venueLoading || seatsLoading) {
    return <LoadingSpinner size="lg" text="Loading seat map..." />;
  }

  if (!event || !isMovie) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">This event does not have a seat map.</p>
        <Link to={`/admin/events/${eventId}`}>
          <Button variant="outline" className="mt-4">Back to Event</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <Link to={`/admin/events/${eventId}`}>
            <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event Details
            </Button>
        </Link>
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2 mb-4">
          <Film className="w-5 h-5 text-primary" /> Seat Map for {event.title}
        </h2>
        {!venue ? (
          <p className="text-muted-foreground">Venue information not found.</p>
        ) : (
          <SeatMap
            venue={venue}
            seats={liveSeats}
            soldSeatIds={event.soldSeatIds || []}
            selected={[]}
            onToggle={() => {}} // No-op for admin view
            currency={event.currency || 'HKD'}
          />
        )}
      </div>
    </div>
  );
};

export default AdminEventSeats;
