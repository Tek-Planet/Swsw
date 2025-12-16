import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../lib/firebase/firebaseConfig";
import { Event, TicketTier } from "../../types/event";

const CheckoutScreen = () => {
  const { eventId, selectedTiers: selectedTiersJSON } = useLocalSearchParams();
  const router = useRouter();

  // Optional but recommended: match your deployed region (us-central1)
  const functions = useMemo(() => getFunctions(undefined, "us-central1"), []);

  const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>(
    {}
  );
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const hasSelection = Object.keys(selectedTiers).length > 0;

  useEffect(() => {
    if (!eventIdStr || !selectedTiersJSON) {
      setLoading(false);
      return;
    }

    let parsedSelectedTiers: { [key: string]: number } = {};
    try {
      parsedSelectedTiers = JSON.parse(selectedTiersJSON as string);
      setSelectedTiers(parsedSelectedTiers);
    } catch (e) {
      console.error("Invalid selectedTiers JSON:", e);
      setLoading(false);
      return;
    }

    const fetchEventAndTiers = async () => {
      setLoading(true);
      try {
        // Fetch event details
        const eventRef = doc(db, "events", eventIdStr);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
        } else {
          setEvent(null);
        }

        // Fetch ticket tiers
        const tiersRef = collection(db, "events", eventIdStr, "ticketTiers");
        const q = query(
          tiersRef,
          where("isActive", "==", true),
          orderBy("sortOrder")
        );
        const tiersSnap = await getDocs(q);
        const tiers = tiersSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as TicketTier)
        );
        setTicketTiers(tiers);

        // Calculate total price
        let total = 0;
        for (const tierId in parsedSelectedTiers) {
          const tier = tiers.find((t) => t.id === tierId);
          if (tier) total += tier.price * parsedSelectedTiers[tierId];
        }
        setTotalPrice(total);
      } catch (error) {
        console.error("Error fetching checkout data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndTiers();
  }, [eventIdStr, selectedTiersJSON]);

  const handlePayment = async () => {
    if (!eventIdStr) return;
    if (!hasSelection) return;
    if (paying) return;

    setPaying(true);
    try {
      const createCheckoutSession = httpsCallable(
        functions,
        "createCheckoutSession"
      );

      const res = await createCheckoutSession({
        eventId: eventIdStr,
        selectedTiers,
      });

      const { url, orderId } = res.data as { url: string; orderId: string };

      // Open Stripe checkout
      await WebBrowser.openBrowserAsync(url);

      // Navigate to processing screen that listens for Firestore order status
      router.push({
        pathname: "/(ticket)/PurchaseProcessingScreen",
        params: { orderId, eventId: eventIdStr },
      });
    } catch (error) {
      console.error("Error starting checkout:", error);
      // TODO: show a toast/snackbar
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Event not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order Summary</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.eventTitle}>{event.title}</Text>

        {Object.keys(selectedTiers).map((tierId) => {
          const tier = ticketTiers.find((t) => t.id === tierId);
          const quantity = selectedTiers[tierId];
          if (!tier) return null;

          return (
            <View key={tierId} style={styles.ticketItem}>
              <Text style={styles.ticketText}>
                {tier.name} x {quantity}
              </Text>
              <Text style={styles.ticketText}>
                ₹{(tier.price * quantity).toLocaleString()}
              </Text>
            </View>
          );
        })}

        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>₹{totalPrice.toLocaleString()}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.ctaButton,
          (!hasSelection || paying) && { opacity: 0.6 },
        ]}
        onPress={handlePayment}
        disabled={!hasSelection || paying}
      >
        {paying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaButtonText}>Pay with Card</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  eventTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 15,
    marginBottom: 15,
  },
  ticketItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  ticketText: {
    color: "#aaa",
    fontSize: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 15,
    marginTop: 15,
  },
  totalText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  ctaButton: {
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CheckoutScreen;
