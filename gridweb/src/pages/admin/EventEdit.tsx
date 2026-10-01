import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/admin/EventForm";
import {
  useEventMutations,
  EventFormData,
  TicketTierFormData,
} from "@/hooks/useEventMutations";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Event, TicketTier } from "@/types";

const EventEdit = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { updateEvent, loading: mutationLoading } = useEventMutations();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTierFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setError("Event ID is required");
        setLoading(false);
        return;
      }

      try {
        // Fetch event
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
          setError("Event not found");
          setLoading(false);
          return;
        }

        const eventData = eventSnap.data();
        setEvent({
          id: eventSnap.id,
          ...eventData,
          eventType: eventData.eventType || "regular",
          startTime:
            eventData.startTime?.toDate?.() || new Date(eventData.startTime),
          endTime:
            eventData.endTime?.toDate?.() ||
            (eventData.endTime ? new Date(eventData.endTime) : undefined),
          showtime:
            eventData.showtime?.toDate?.() ||
            (eventData.showtime ? new Date(eventData.showtime) : undefined),
          ticketsAvailableOn:
            eventData.ticketsAvailableOn?.toDate?.() ||
            (eventData.ticketsAvailableOn
              ? new Date(eventData.ticketsAvailableOn)
              : undefined),
        } as Event);

        // Fetch ticket tiers
        const tiersRef = collection(db, "events", eventId, "ticketTiers");
        const tiersQuery = query(tiersRef, orderBy("sortOrder", "asc"));
        const tiersSnap = await getDocs(tiersQuery);

        const tiersData = tiersSnap.docs.map((doc, index) => ({
          id: doc.id,
          ...doc.data(),
          sortOrder: doc.data().sortOrder || index + 1,
        })) as TicketTierFormData[];

        setTicketTiers(tiersData);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleSubmit = async (
    eventData: EventFormData,
    tiers: TicketTierFormData[]
  ) => {
    if (!eventId) return;

    const success = await updateEvent(eventId, eventData, tiers);
    if (success) {
      navigate("/admin/events");
    }
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
            onClick={() => navigate("/admin/events")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Error
            </h1>
            <p className="text-muted-foreground">
              {error || "Event not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Convert Event to EventFormData
  const initialData: EventFormData = {
    title: event.title,
    subtitle: event.subtitle,
    description: event.description,
    coverImageUrl: event.coverImageUrl,
    startTime: event.startTime,
    endTime: event.endTime,
    ticketsAvailableOn: event.ticketsAvailableOn,
    location: event.location,
    visibility: event.visibility,
    status: event.status,
    maxAttendees: event.maxAttendees,
    hostId: event.hostId,
    hostName: event.hostName,
    hostAvatarUrl: event.hostAvatarUrl,
    tags: event.tags,
    currency: event.currency,
    bookingFeePercent: event.bookingFeePercent,
    gstPercent: event.gstPercent,
    isInviteOnly: event.isInviteOnly,
    customQuestions: event.customQuestions,
    // Movie event fields
    eventType: event.eventType || "regular",
    venueId: event.venueId,
    showtime: event.showtime,
    movie: event.movie,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/events")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Edit Event
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Update the event details below.
          </p>
        </div>
      </div>

      {/* Form */}
      <EventForm
        mode="edit"
        eventId={eventId}
        initialData={initialData}
        initialTiers={ticketTiers}
        onSubmit={handleSubmit}
        isLoading={mutationLoading}
      />
    </div>
  );
};

export default EventEdit;
