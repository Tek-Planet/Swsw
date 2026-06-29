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
import { getCurrencySymbol } from "@/lib/utils";

const theme = { colors: Colors.dark, fonts: Fonts.default };

const MovieTicketSelectionScreen = () => {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

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
        const eventData = eventSnap.data();
        if (eventData.startTime) {
          eventData.startTime = eventData.startTime.toDate().toISOString();
        }
        if (eventData.endTime) {
          eventData.endTime = eventData.endTime.toDate().toISOString();
        }
        setEvent({ id: eventSnap.id, ...eventData } as Event);
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

  const price = useMemo(() => {
    if (!venue || selectedSeats.length === 0) return 0;
    return selectedSeats.reduce((total, seatId) => {
      const [rowLabel] = seatId.split("-");
      const row = venue.rows.find((r: any) => r.label === rowLabel);
      return total + (row?.price || 0);
    }, 0);
  }, [selectedSeats, venue]);

  const handleCheckout = () => {
    if (!venue || !eventId || !event || isNavigating) return;

    setIsNavigating(true);
    const seatsToCheckout = selectedSeats.map((seatId) => {
      const [rowLabel, seatNumber] = seatId.split("-");
      const row = venue.rows.find((r: any) => r.label === rowLabel);
      return {
        id: seatId,
        price: row?.price || 0,
        tier: row?.tier || "Standard",
        label: `${rowLabel}${seatNumber}`,
      };
    });

    const selectedSeatsJSON = JSON.stringify(seatsToCheckout);

    const serializableEvent = {
      id: event.id,
      title: event.title,
      bookingFeePercent: event.bookingFeePercent,
      currency: event.currency,
      coverImageUrl: event.coverImageUrl,
      startTime: event.startTime,
      endTime: event.endTime,
      venueId: event.venueId,
    };
    const eventJSON = JSON.stringify(serializableEvent);

    router.push({
      pathname: "/(ticket)/CheckoutScreen",
      params: {
        eventId: eventId,
        selectedSeats: selectedSeatsJSON,
        event: eventJSON,
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

  const currencySymbol = event ? getCurrencySymbol(event.currency) : "₹";
  const isContinueDisabled = selectedSeats.length === 0 || isNavigating;

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
      <View style={styles.stickyFooter}>
        <Text style={styles.totalPrice}>
          Total: {currencySymbol}
          {price.toLocaleString()}
        </Text>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            isContinueDisabled && styles.ctaButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={isContinueDisabled}
        >
          {isNavigating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.ctaButtonText}>Review Order</Text>
          )}
        </TouchableOpacity>
      </View>
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
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalPrice: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  ctaButton: {
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 120, // Ensure button has a decent width for the activity indicator
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButtonDisabled: {
    backgroundColor: "#888",
    opacity: 0.7,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MovieTicketSelectionScreen;
