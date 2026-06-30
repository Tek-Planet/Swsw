import TopNavBar from "@/components/TopNavBar";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedView } from "../../components/themed-view";
import { db } from "../../lib/firebase/firebaseConfig";
import { Event, TicketTier } from "../../types/event";
import { getCurrencySymbol } from "../../lib/utils";
import MovieTicketSelectionScreen from "./MovieTicketSelectionScreen";

const TicketSelectionScreen = () => {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>(
    {}
  );
  const [pricing, setPricing] = useState({
    subtotal: 0,
    feeBase: 0,
    processingFee: 0,
    gstAmount: 0,
    total: 0,
  });
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventDetails = async () => {
      const eventRef = doc(db, "events", eventId as string);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const eventData = { id: eventSnap.id, ...eventSnap.data() } as Event;
        eventData.currency = eventData.currency || "INR";
        setEvent(eventData);
      }
    };

    const fetchTicketTiers = async () => {
      const tiersRef = collection(
        db,
        "events",
        eventId as string,
        "ticketTiers"
      );
      const q = query(
        tiersRef,
        where("isActive", "==", true),
        orderBy("sortOrder")
      );
      const tiersSnap = await getDocs(q);
      const tiers = tiersSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as TicketTier)
      );
      setTicketTiers(tiers);
    };

    fetchEventDetails();
    fetchTicketTiers();
  }, [eventId]);

  const handleQuantityChange = (tierId: string, quantity: number) => {
    const newSelectedTiers = { ...selectedTiers, [tierId]: quantity };
    if (quantity <= 0) {
      delete newSelectedTiers[tierId];
    }
    setSelectedTiers(newSelectedTiers);
  };

  useEffect(() => {
    if (!event) return;
    const getChargeAmount = (tier: TicketTier): number => {
      if (tier.type === "table" && tier.chargeAmount != null) {
        return tier.chargeAmount;
      }
      return tier.price;
    };

    let subtotalCharged = 0;
    let feeBase = 0;

    Object.entries(selectedTiers).forEach(([tierId, qty]) => {
      const tier = ticketTiers.find((t) => t.id === tierId);
      if (tier && qty > 0) {
        const chargeAmount = getChargeAmount(tier);
        subtotalCharged += chargeAmount * qty;

        if (tier.type !== "table") {
          feeBase += chargeAmount * qty;
        }
      }
    });

    const feePercentage = event.bookingFeePercent
      ? event.bookingFeePercent / 100
      : 0.1;
    const processingFee = feeBase > 0 ? Math.round(feeBase * feePercentage) : 0;
    
    const gstRate = event.gstPercent ? Number(event.gstPercent) / 100 : 0;
    const preTaxTotal = subtotalCharged + processingFee;
    const gstAmount = preTaxTotal > 0 && gstRate > 0 ? Math.round(preTaxTotal * gstRate) : 0;

    const total = preTaxTotal + gstAmount;

    setPricing({ subtotal: subtotalCharged, feeBase, processingFee, gstAmount, total });
  }, [selectedTiers, ticketTiers, event]);

  const currencySymbol = event ? getCurrencySymbol(event.currency) : "₹";

  const renderTier = ({ item }: { item: TicketTier }) => {
    const maxQuantity = item.type === "table" ? 1 : 10;
    const currentQuantity = selectedTiers[item.id] || 0;

    const isTableWithDeposit =
      item.type === "table" &&
      item.chargeAmount != null &&
      item.chargeAmount < item.price;

    return (
      <View style={styles.tierCard}>
        <View style={styles.tierInfo}>
          <Text style={styles.tierName}>{item.name}</Text>

          <Text style={styles.tierPrice}>
            {currencySymbol}
            {item.price.toLocaleString()}
          </Text>

          {isTableWithDeposit && item.chargeAmount != null && (
            <Text style={styles.depositLabel}>
              (A deposit of {currencySymbol}
              {item.chargeAmount.toLocaleString()} will be charged at checkout)
            </Text>
          )}

          {item.description && (
            <Text style={styles.tierDescription}>{item.description}</Text>
          )}
        </View>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item.id, currentQuantity - 1)}
            disabled={currentQuantity === 0}
          >
            <Text
              style={[
                styles.quantityButton,
                currentQuantity === 0 && styles.disabledQuantityButton,
              ]}
            >
              -
            </Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{currentQuantity}</Text>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item.id, currentQuantity + 1)}
            disabled={currentQuantity >= maxQuantity}
          >
            <Text
              style={[
                styles.quantityButton,
                currentQuantity >= maxQuantity && styles.disabledQuantityButton,
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleReviewOrder = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push({
      pathname: "/(ticket)/CheckoutScreen",
      params: {
        eventId: eventId as string,
        selectedTiers: JSON.stringify(selectedTiers),
      },
    });
  };

  const isContinueDisabled =
    Object.keys(selectedTiers).length === 0 || isNavigating;

  if (!event) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </ThemedView>
    );
  }

  if (event.eventType === "movie") {
    return <MovieTicketSelectionScreen />;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={{ paddingHorizontal: 20 }}>
        <TopNavBar title={"Select Tickets"} onBackPress={() => router.back()} />
      </View>
      <FlatList
        data={ticketTiers}
        renderItem={renderTier}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.stickyFooter}>
        <View style={styles.priceDetails}>
          <Text style={styles.totalPrice}>
            Total: {currencySymbol}
            {pricing.total.toLocaleString()}
          </Text>
          {pricing.total > 0 && (
            <Text style={styles.priceBreakdown} numberOfLines={2}>
              Subtotal: {currencySymbol}{pricing.subtotal.toLocaleString()}
              {' + '}Fee: {currencySymbol}{pricing.processingFee.toLocaleString()}
              {pricing.gstAmount > 0 && ` + GST: ${currencySymbol}${pricing.gstAmount.toLocaleString()}`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            isContinueDisabled && styles.ctaButtonDisabled,
          ]}
          onPress={handleReviewOrder}
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
    backgroundColor: "#000",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  tierCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  tierPrice: {
    color: "#aaa",
    fontSize: 16,
    marginTop: 5,
  },
  depositLabel: {
    color: "#aaa",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 5,
  },
  tierDescription: {
    color: "#888",
    fontSize: 14,
    marginTop: 5,
  },
  tierInfo: {
    flex: 1,
    marginRight: 10,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    color: "#4a90e2",
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 10,
  },
  disabledQuantityButton: {
    color: "#555",
  },
  quantityText: {
    color: "#fff",
    fontSize: 18,
    marginHorizontal: 10,
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceDetails: {
    flex: 1,
    marginRight: 10,
  },
  totalPrice: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  priceBreakdown: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 120,
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
  listContainer: {
    paddingTop: 10,
    paddingBottom: 120,
  },
});

export default TicketSelectionScreen;
