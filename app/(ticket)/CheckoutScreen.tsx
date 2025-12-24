
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TopNavBar from "../../components/TopNavBar";
import { ThemedView } from "../../components/themed-view";
import { db } from "../../lib/firebase/firebaseConfig";
import { Event, TicketTier } from "../../types/event";

const CheckoutScreen = () => {
  const { eventId, selectedTiers: selectedTiersJSON } = useLocalSearchParams();
  const router = useRouter();

  const functions = useMemo(() => getFunctions(undefined, "us-central1"), []);

  const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>(
    {}
  );
  const [promoCode, setPromoCode] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);
  const [total, setTotal] = useState(0);
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
        const eventRef = doc(db, "events", eventIdStr);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
        } else {
          setEvent(null);
        }

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

        let currentSubtotal = 0;
        for (const tierId in parsedSelectedTiers) {
          const tier = tiers.find((t) => t.id === tierId);
          if (tier) {
            currentSubtotal += tier.price * parsedSelectedTiers[tierId];
          }
        }

        const fee = currentSubtotal > 0 ? Math.round(currentSubtotal * 0.1) : 0;
        setSubtotal(currentSubtotal);
        setProcessingFee(fee);
        setTotal(currentSubtotal + fee);
      } catch (error) {
        console.error("Error fetching checkout data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndTiers();
  }, [eventIdStr, selectedTiersJSON]);

  const handlePayment = async () => {
    if (!eventIdStr || !hasSelection || paying) return;

    setPaying(true);
    try {
      const createCheckoutSession = httpsCallable(
        functions,
        "createCheckoutSession"
      );

      const res = await createCheckoutSession({
        eventId: eventIdStr,
        selectedTiers,
        promoCode: promoCode.trim(),
      });

      const { url, orderId, free, vip } = res.data as {
        url?: string;
        orderId: string;
        free?: boolean;
        vip?: boolean;
      };

      if (url) {
        await WebBrowser.openBrowserAsync(url);
      } else if (!free && !vip) {
        // Should not happen, but good to handle
        throw new Error("Invalid checkout response from server.");
      }

      // Navigate to processing screen for all cases
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
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </ThemedView>
    );
  }

  if (!event) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <Text style={styles.text}>Event not found.</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
        <TopNavBar title="Order Summary" onBackPress={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent}>

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

                <View style={styles.subtotalContainer}>
                <Text style={styles.ticketText}>Subtotal</Text>
                <Text style={styles.ticketText}>₹{subtotal.toLocaleString()}</Text>
                </View>

                {processingFee > 0 && (
                <View style={styles.subtotalContainer}>
                    <Text style={styles.ticketText}>Processing fee (10%)</Text>
                    <Text style={styles.ticketText}>₹{processingFee.toLocaleString()}</Text>
                </View>
                )}

                <View style={styles.totalContainer}>
                <Text style={styles.totalText}>Total</Text>
                <Text style={styles.totalText}>₹{total.toLocaleString()}</Text>
                </View>
            </View>

            <TextInput
                style={styles.promoInput}
                placeholder="Promo code (optional)"
                placeholderTextColor="#888"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
            />

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
                <Text style={styles.ctaButtonText}>Proceed to Checkout</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding:10
  },
  centeredContainer: {
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingTop: 10, 
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
    marginBottom: 20,
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
  subtotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
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
  promoInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
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
