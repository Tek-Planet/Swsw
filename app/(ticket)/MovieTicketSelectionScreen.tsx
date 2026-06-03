import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

import SeatMap from "@/components/SeatMap";
import StickyTopBar from "@/components/StickyTopBar";
import { Colors, Fonts } from "@/constants/theme";
import { useEventSeats } from "@/hooks/useEventSeats";
import { useVenue } from "@/hooks/useVenue";
import { db } from "@/lib/firebase/firebaseConfig";
import { Event } from "@/types/event";
import { ThemedView } from "@/components/themed-view";

const theme = { colors: Colors.dark, fonts: Fonts.default };

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

const MovieTicketSelectionScreen = () => {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const { venue, loading: venueLoading } = useVenue(
    event?.eventType === "movie" ? event.venueId : undefined
  );
  const { seats, loading: seatsLoading } = useEventSeats(
    event?.eventType === "movie" ? eventId : undefined
  );

  useEffect(() => {
    if (!eventId) return;

    const fetchEventDetails = async () => {
      const eventRef = doc(db, "events", eventId as string);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const eventData = { id: eventSnap.id, ...eventSnap.data() } as Event;
        setEvent(eventData);
      }
      setLoading(false);
    };

    fetchEventDetails();
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

  const fullLoading = loading || venueLoading || seatsLoading;

  if (fullLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.tint} />
      </ThemedView>
    );
  }

  if (!event) {
    return <Text style={styles.errorText}>Event not found.</Text>;
  }

  return (
    <ThemedView style={styles.container}>
      <StickyTopBar />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        {venue && Object.keys(seats).length > 0 ? (
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
        )}
      </ScrollView>
      <MovieBookingBar
        selectedSeats={selectedSeats}
        venue={venue}
        onCheckout={handleCheckout}
      />
    </ThemedView>
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

export default MovieTicketSelectionScreen;
