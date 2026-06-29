import { useState } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  serverTimestamp,
  Timestamp,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { Event, TicketTier, CustomQuestion, MovieDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';

export interface EventFormData {
  title: string;
  subtitle?: string;
  description: string;
  coverImageUrl?: string;
  startTime: Date;
  endTime?: Date;
  timeZone?: string;
  location: {
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  visibility?: 'public' | 'private' | 'unlisted';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  maxAttendees?: number;
  tags?: string[];
  hostId?: string;
  hostName?: string;
  hostAvatarUrl?: string;
  currency?: 'INR' | 'USD' | 'HKD' | 'SGD';
  bookingFeePercent?: number;
  gstPercent?: number;
  isInviteOnly?: boolean;
  customQuestions?: CustomQuestion[];
  eventType?: 'regular' | 'movie';
  venueId?: string;
  showtime?: Date;
  movie?: MovieDetails;
}

export interface TicketTierFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'ticket' | 'addon' | 'table' | 'donation';
  isActive: boolean;
  sortOrder: number;
  quantityTotal?: number;
  chargeAmount?: number;
  genderCategory?: 'male' | 'female' | 'other';
  genderQuotas?: {
    male: number;
    female: number;
    other: number;
  };
}

export const useEventMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateEventQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-all-events'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const createEvent = async (
    eventData: EventFormData, 
    ticketTiers?: TicketTierFormData[]
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // Build event document, filtering out undefined values
      const eventDoc: Record<string, any> = {
        startTime: Timestamp.fromDate(eventData.startTime),
        endTime: eventData.endTime ? Timestamp.fromDate(eventData.endTime) : null,
        attendeesCount: 0,
        attendeeIds: [],
        likesCount: 0,
        popularityScore: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only include defined values from eventData
      Object.entries(eventData).forEach(([key, value]) => {
        if (value === undefined || key === 'startTime' || key === 'endTime') return;
        if (key === 'showtime' && value instanceof Date) {
          eventDoc.showtime = Timestamp.fromDate(value);
          return;
        }
        eventDoc[key] = value;
      });

      // Create event
      const eventsRef = collection(db, 'events');
      const docRef = await addDoc(eventsRef, eventDoc);
      const eventId = docRef.id;

      // If it's a movie event, create the seats from the venue layout
      if (eventData.eventType === 'movie' && eventData.venueId) {
        const venueRef = doc(db, 'venues', eventData.venueId);
        const venueSnap = await getDoc(venueRef);

        if (venueSnap.exists()) {
          const venueData = venueSnap.data();
          const rows = venueData.rows || [];
          const seatBatch = writeBatch(db);

          rows.forEach((row: any) => {
            const rowPrice = row.price || 0;
            const rowLabel = row.label || '';

            (row.seats || []).forEach((seat: any) => {
              if (seat.type === 'aisle') return;

              const seatLabel = seat.label || '';
              const seatId = `${rowLabel}${seatLabel}`;
              const seatRef = doc(db, 'events', eventId, 'seats', seatId);
              
              seatBatch.set(seatRef, {
                rowLabel,
                seatLabel,
                price: rowPrice,
                type: seat.type || 'normal',
                status: 'available',
                heldBy: null,
                heldUntil: null,
                orderId: null,
                userId: null,
              });
            });
          });

          await seatBatch.commit();
        }
      }

      // Create ticket tiers if provided (for non-movie events)
      if (ticketTiers && ticketTiers.length > 0) {
        const batch = writeBatch(db);
        
        ticketTiers.forEach((tier, index) => {
          const tierRef = doc(collection(db, 'events', eventId, 'ticketTiers'));
          batch.set(tierRef, {
            name: tier.name,
            description: tier.description,
            price: tier.price,
            currency: tier.currency || 'inr',
            type: tier.type,
            isActive: tier.isActive,
            sortOrder: tier.sortOrder || index + 1,
            quantityTotal: tier.quantityTotal || null,
            quantitySold: 0,
            chargeAmount: tier.chargeAmount || null,
            genderQuotas: tier.genderQuotas || null,
            genderSold: tier.genderQuotas ? { male: 0, female: 0, other: 0 } : null,
            createdAt: serverTimestamp(),
          });
        });

        await batch.commit();
      }

      toast({
        title: 'Event created',
        description: 'Your event has been created successfully.',
      });

      invalidateEventQueries();
      return eventId;
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (
    eventId: string, 
    eventData: Partial<EventFormData>,
    ticketTiers?: TicketTierFormData[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const eventRef = doc(db, 'events', eventId);
      
      // Get the existing event data to check its type
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      const existingEventData = eventSnap.data();

      // Backfill seats for existing movie events that don't have them
      if ((eventData.eventType === 'movie' || existingEventData.eventType === 'movie') && (eventData.venueId || existingEventData.venueId)) {
        const seatsRef = collection(db, 'events', eventId, 'seats');
        const seatsSnap = await getDocs(seatsRef);

        if (seatsSnap.empty) {
          const venueId = eventData.venueId || existingEventData.venueId;
          const venueRef = doc(db, 'venues', venueId);
          const venueSnap = await getDoc(venueRef);

          if (venueSnap.exists()) {
            const venueData = venueSnap.data();
            const rows = venueData.rows || [];
            const seatBatch = writeBatch(db);

            rows.forEach((row: any) => {
              const rowPrice = row.price || 0;
              const rowLabel = row.label || '';

              (row.seats || []).forEach((seat: any) => {
                if (seat.type === 'aisle') return;

                const seatLabel = seat.label || '';
                const seatId = `${rowLabel}${seatLabel}`;
                const seatRef = doc(db, 'events', eventId, 'seats', seatId);
                
                seatBatch.set(seatRef, {
                  rowLabel,
                  seatLabel,
                  price: rowPrice,
                  type: seat.type || 'normal',
                  status: 'available',
                  heldBy: null,
                  heldUntil: null,
                  orderId: null,
                  userId: null,
                });
              });
            });

            await seatBatch.commit();
            toast({
              title: 'Seat Map Generated',
              description: 'The seat map has been successfully generated for this event.',
            });
          }
        }
      }

      // Prepare update data
      const updateData: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };
      Object.entries(eventData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      // Convert dates to Timestamps
      if (eventData.startTime) {
        updateData.startTime = Timestamp.fromDate(eventData.startTime);
      }
      if (eventData.endTime) {
        updateData.endTime = Timestamp.fromDate(eventData.endTime);
      } else if (eventData.endTime === undefined && 'endTime' in eventData) {
        updateData.endTime = null;
      }
      if (eventData.showtime instanceof Date) {
        updateData.showtime = Timestamp.fromDate(eventData.showtime);
      }

      await updateDoc(eventRef, updateData);

      // Update ticket tiers if provided
      if (ticketTiers) {
        const batch = writeBatch(db);
        for (const tier of ticketTiers) {
          const tierData = {
            name: tier.name,
            price: tier.price,
            currency: tier.currency || 'inr',
            type: tier.type,
            isActive: tier.isActive,
            sortOrder: tier.sortOrder,
            quantityTotal: tier.quantityTotal ?? null,
            chargeAmount: tier.chargeAmount ?? null,
            genderQuotas: tier.genderQuotas ?? null,
            ...(tier.description !== undefined && { description: tier.description }),
          };

          if (tier.id) {
            const tierRef = doc(db, 'events', eventId, 'ticketTiers', tier.id);
            batch.update(tierRef, { ...tierData, updatedAt: serverTimestamp() });
          } else {
            const tierRef = doc(collection(db, 'events', eventId, 'ticketTiers'));
            batch.set(tierRef, { ...tierData, description: tierData.description || '', quantitySold: 0, createdAt: serverTimestamp() });
          }
        }
        await batch.commit();
      }

      toast({
        title: 'Event updated',
        description: 'Your event has been updated successfully.',
      });

      invalidateEventQueries();
      return true;
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);

      toast({
        title: 'Event deleted',
        description: 'The event has been deleted.',
      });

      invalidateEventQueries();
      return true;
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTicketTier = async (eventId: string, tierId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const tierRef = doc(db, 'events', eventId, 'ticketTiers', tierId);
      await deleteDoc(tierRef);

      toast({
        title: 'Ticket tier deleted',
        description: 'The ticket tier has been removed.',
      });

      return true;
    } catch (err) {
      console.error('Error deleting ticket tier:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: 'Failed to delete ticket tier.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    deleteTicketTier,
    loading,
    error,
  };
};
