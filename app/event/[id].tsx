
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DescriptionBlock from "@/components/DescriptionBlock";
import EventHeroCard from "@/components/EventHeroCard";
import EventMetaCard from "@/components/EventMetaCard";
import FloatingRSVPBar from "@/components/FloatingRSVPBar";
import HostInfo from "@/components/HostInfo";
import PhotoAlbum from "@/components/PhotoAlbum";
import SeatMap from "@/components/SeatMap";
import StickyTopBar from "@/components/StickyTopBar";
import TicketHoldersList from "@/components/TicketHoldersList";
import ActivityFeed from "@/components/event/ActivityFeed";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getProfilesForUserIds,
  listenToEvent,
} from "@/lib/services/eventService";
import { useEventSeats } from "@/hooks/useEventSeats";
import { useVenue } from "@/hooks/useVenue";
import { Event } from "@/types/event";

const theme = { colors: Colors.dark, fonts: Fonts.default };

interface HostInfoProps {
  name: string;
  photoURL?: string;
}

export interface TicketHolder {
  id: string;
  avatar: string;
  firstName: string;
}

const MovieBookingBar = ({
  selectedSeats,
  venue,
  onCheckout,
}: {
  selectedSeats: string[];
  venue: any;
  onCheckout: () => void;
}) => {
  const price = useMemo(() => {
    if (!venue || selectedSeats.length === 0) return 0;
    return selectedSeats.reduce((total, seatId) => {
      const [rowLabel] = seatId.split("-");
      const row = venue.rows.find((r: any) => r.label === rowLabel);
      return total + (row?.price || 0);
    }, 0);
  }, [selectedSeats, venue]);

  if (selectedSeats.length === 0) {
    return (
      <View style={[styles.floatingBar, styles.floatingBarDisabled]}>
        <Text style={styles.floatingBarText}>Select your seats</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.floatingBar, styles.floatingBarActive]}
      onPress={onCheckout}
    >
      <View>
        <Text style={styles.floatingBarText}>
          {selectedSeats.length} Seat{selectedSeats.length > 1 ? "s" : ""}
        </Text>
        <Text style={styles.floatingBarPrice}>
          Total: {venue.currency} {price}
        </Text>
      </View>
      <Text style={styles.floatingBarText}>Continue</Text>
    </TouchableOpacity>
  );
};

const EventDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.uid;
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [host, setHost] = useState<HostInfoProps | null>(null);
  const [ticketHolders, setTicketHolders] = useState<TicketHolder[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const eventId = typeof id === 'string' ? id : undefined;
  const { venue, loading: venueLoading } = useVenue(
    event?.eventType === "movie" ? event.venueId : undefined
  );
  const { seats, loading: seatsLoading } = useEventSeats(
    event?.eventType === "movie" ? eventId : undefined
  );

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = listenToEvent(eventId, async (eventData) => {
      setEvent(eventData);
      if (eventData) {
        if (eventData.hostId) {
          const hostProfile = (
            await getProfilesForUserIds([eventData.hostId])
          ).get(eventData.hostId);
          if (hostProfile) {
            setHost({
              name: hostProfile.displayName || hostProfile.username,
              photoURL: hostProfile.photoUrl,
            });
          }
        }
        const profilesMap = await getProfilesForUserIds(eventData.attendeeIds);
        const holdersList: TicketHolder[] = Array.from(
          profilesMap.entries()
        ).map(([profId, profile]) => ({
          id: profId,
          avatar: profile.photoUrl || `https://i.pravatar.cc/150?u=${profId}`,
          firstName: profile.displayName || profile.username,
        }));
        setTicketHolders(holdersList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  const handleToggleSeat = (seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  };

  const handleCheckout = () => {
    if (!venue || !eventId) return;

    const seatsToCheckout = selectedSeats.map((seatId) => {
      const [rowLabel] = seatId.split("-");
      const row = venue.rows.find((r: any) => r.label === rowLabel);
      return {
        id: seatId,
        price: row?.price || 0,
        tier: row?.tier || "Standard",
      };
    });

    const selectedSeatsJSON = JSON.stringify(seatsToCheckout);

    router.push({
      pathname: "/(ticket)/CheckoutScreen",
      params: {
        eventId: eventId,
        selectedSeats: selectedSeatsJSON,
      },
    });
  };

  const hasTicket = useMemo(() => {
    if (!userId || !event || !event.attendeeIds) return false;
    return event.attendeeIds.includes(userId);
  }, [userId, event]);

  const memoizedTicketHolders = useMemo(() => ticketHolders, [ticketHolders]);

  const isMovieEvent = event?.eventType === "movie";
  const fullLoading =
    loading || (isMovieEvent && (venueLoading || seatsLoading));

  if (fullLoading) {
    return (
      <ActivityIndicator
        style={styles.centerContainer}
        size="large"
        color={theme.colors.tint}
      />
    );
  }

  if (!event) {
    return <Text style={styles.errorText}>Event not found.</Text>;
  }

  const eventDate = event.startTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const eventTime = event.startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const isUpcoming =
    event.startTime > new Date() && event.status === "published";

  return (
    <View style={styles.container}>
      <StickyTopBar />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <EventHeroCard eventName={event.title} imageUrl={event.coverImageUrl} />
        <EventMetaCard
          date={eventDate}
          time={eventTime}
          location={event.location.address || "TBD"}
          address={event.location.city}
        />
        {host && <HostInfo host={host} />}
        <DescriptionBlock text={event.description} />

        {hasTicket ? (
          <>
            <TicketHoldersList
              ticketHolders={memoizedTicketHolders}
              total={event.attendeeIds?.length || 0}
            />
            <PhotoAlbum eventId={eventId} />
            <ActivityFeed eventId={eventId} hasAccess={true} />
          </>
        ) : isMovieEvent ? (
          venue && Object.keys(seats).length > 0 ? (
            <SeatMap
              venue={venue}
              seats={seats}
              soldSeatIds={event.soldSeatIds || []}
              selected={selectedSeats}
              onToggle={handleToggleSeat}
              currency={event.currency}
            />
          ) : (
            <View style={styles.lockedSection}>
              <ActivityIndicator size="large" color={theme.colors.tint} />
              <Text style={styles.lockedText}>Loading Seating Map...</Text>
            </View>
          )
        ) : (
          <View style={styles.lockedSection}>
            <Ionicons name="lock-closed" size={32} color="#A8A8A8" />
            <Text style={styles.lockedText}>
              Buy a ticket to see photos and who's going
            </Text>
          </View>
        )}
      </ScrollView>

      {isUpcoming &&
        (isMovieEvent ? (
          <MovieBookingBar
            selectedSeats={selectedSeats}
            venue={venue}
            onCheckout={handleCheckout}
          />
        ) : (
          <FloatingRSVPBar eventId={eventId} hasTicket={hasTicket} />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
  errorText: {
    color: theme.colors.text,
    textAlign: "center",
    marginTop: 20,
  },
  lockedSection: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedText: {
    color: "#A8A8A8",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  floatingBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  floatingBarDisabled: {
    backgroundColor: "#333",
    justifyContent: "center",
  },
  floatingBarActive: {
    backgroundColor: theme.colors.tint,
  },
  floatingBarText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  floatingBarPrice: {
    color: theme.colors.text,
    fontSize: 12,
  },
});

export default EventDetailScreen;
