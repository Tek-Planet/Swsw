import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventForm } from '@/components/admin/EventForm';
import { useEventMutations, EventFormData, TicketTierFormData } from '@/hooks/useEventMutations';

const EventCreate = () => {
  const navigate = useNavigate();
  const { createEvent, loading } = useEventMutations();

  const handleSubmit = async (eventData: EventFormData, ticketTiers: TicketTierFormData[]) => {
    const eventId = await createEvent(eventData, ticketTiers);
    if (eventId) {
      navigate('/admin/events');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            Create Event
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Fill in the details to create a new event.
          </p>
        </div>
      </div>

      {/* Form */}
      <EventForm
        mode="create"
        onSubmit={handleSubmit}
        isLoading={loading}
      />
    </div>
  );
};

export default EventCreate;
