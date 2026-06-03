import { Feather } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import TopNavBar from "../../components/TopNavBar";
import { ThemedView } from "../../components/themed-view";
import { db } from "../../lib/firebase/firebaseConfig";
import { Event, TableContactDetails, TicketTier } from "../../types/event";
import Constants from "expo-constants";
import { useEvent } from "@/hooks/useEvent";
import { Seat } from "@/types/movie";
import OrderSummaryCard from "@/components/OrderSummaryCard";
import { createOrder } from "@/lib/services/eventService";
import { getCurrencySymbol } from "@/lib/utils";

// Add PromoCodeData interface
interface PromoCodeData {
  id: string;
  code: string;
  discountType: "percent" | "fixed" | "free";
  discountValue: number;
  maxRedemptions: number;
  currentRedemptions: number;
  isActive: boolean;
  eventId: string;
}

const razorpay_api_key = Constants?.expoConfig?.extra?.razorpay_api_key;

const CheckoutScreen = () => {
  const {
    eventId,
    selectedTiers: selectedTiersJSON,
    selectedSeats: selectedSeatsJSON,
    event: eventJSON, // <-- Receive the serialized event
  } = useLocalSearchParams();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const functions = useMemo(() => getFunctions(), []);
  const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;

  // Unified State
  const [event, setEvent] = useState<Event | null>(null);
  const [orderType, setOrderType] = useState<"movie" | "regular" | null>(null);

  // Movie Order State
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  // Regular Order State
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>({});
  const [attendees, setAttendees] = useState<{ name: string; email: string; phone: string }[]>([]);
  const [tableContactDetails, setTableContactDetails] = useState<TableContactDetails>({
    fullName: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Common State
  const [pricing, setPricing] = useState({
    subtotal: 0,
    feeBase: 0,
    processingFee: 0,
    total: 0,
    discount: 0,
  });
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<PromoCodeData | null>(null);
  const [promoValidating, setPromoValidating] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use the hook conditionally for regular events ONLY
  const { event: fetchedEvent, loading: eventLoading } = useEvent(
    orderType === "regular" ? eventIdStr : undefined
  );

  // Determine Order Type and Parse Data
  useEffect(() => {
    if (selectedSeatsJSON && eventJSON) {
      setOrderType("movie");
      try {
        setSelectedSeats(JSON.parse(selectedSeatsJSON as string));
        const parsedEvent = JSON.parse(eventJSON as string);
        // Re-hydrate Date objects
        if (parsedEvent.startTime) {
          parsedEvent.startTime = new Date(parsedEvent.startTime);
        }
        if (parsedEvent.endTime) {
          parsedEvent.endTime = new Date(parsedEvent.endTime);
        }
        setEvent(parsedEvent as Event);
        setLoading(false); // All data is here for movies, stop loading.
      } catch (e) {
        console.error("Invalid JSON for movie checkout:", e);
        Alert.alert("Error", "Could not load your cart. Please try again.");
        router.back();
      }
    } else if (selectedTiersJSON) {
      setOrderType("regular");
      try {
        setSelectedTiers(JSON.parse(selectedTiersJSON as string));
        // Let the useEvent hook and other effects handle loading
      } catch (e) {
        console.error("Invalid JSON for selected tiers:", e);
      }
    } else {
      setLoading(false);
      Alert.alert("Error", "No items in cart.");
      router.back();
    }
  }, [selectedSeatsJSON, eventJSON, selectedTiersJSON]);

  // Effect for regular event data loading
  useEffect(() => {
    if (orderType === "regular") {
      if (fetchedEvent) {
        setEvent(fetchedEvent);
      }
      // The useEvent hook handles loading state
      setLoading(eventLoading);
    }
  }, [orderType, fetchedEvent, eventLoading]);

  // Fetch Tiers for Regular Orders
  useEffect(() => {
    if (orderType !== "regular" || !eventIdStr) return;

    const fetchTiers = async () => {
      setLoading(true);
      try {
        const tiersRef = collection(db, "events", eventIdStr, "ticketTiers");
        const q = query(
          tiersRef,
          where("isActive", "==", true),
          orderBy("sortOrder")
        );
        const tiersSnap = await getDocs(q);
        setTicketTiers(
          tiersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TicketTier))
        );
      } catch (error) {
        console.error("Error fetching ticket tiers:", error);
      } finally {
        setLoading(false); // Loading is done after tiers are fetched
      }
    };

    if (event) { // Only fetch tiers if the event is loaded
        fetchTiers();
    }
  }, [orderType, eventIdStr, event]);

  // Set up Attendee Forms for Regular Orders
  useEffect(() => {
    if (orderType !== "regular" || ticketTiers.length === 0) return;
    const individualTicketCount = Object.entries(selectedTiers).reduce(
      (acc, [tierId, qty]) => {
        const tier = ticketTiers.find((t) => t.id === tierId);
        if (tier && tier.type === "ticket") {
          return acc + (typeof qty === "number" ? qty : 0);
        }
        return acc;
      },
      0
    );
    setAttendees(
      Array(individualTicketCount).fill({ name: "", email: "", phone: "" })
    );
  }, [orderType, selectedTiers, ticketTiers]);

  // Calculate Pricing (Unified)
  useEffect(() => {
    if (!event) return;

    let subtotalCharged = 0;
    let feeBase = 0;

    if (orderType === "movie") {
      subtotalCharged = selectedSeats.reduce((acc, seat) => acc + seat.price, 0);
      feeBase = subtotalCharged; // For movies, fee is on the full amount
    } else if (orderType === "regular" && ticketTiers.length > 0) {
      const getChargeAmount = (tier: TicketTier): number => {
        if (tier.type === "table" && tier.chargeAmount != null)
          return tier.chargeAmount;
        return tier.price;
      };
      Object.entries(selectedTiers).forEach(([tierId, qty]) => {
        const tier = ticketTiers.find((t) => t.id === tierId);
        if (tier && typeof qty === "number" && qty > 0) {
          const chargeAmount = getChargeAmount(tier);
          subtotalCharged += chargeAmount * qty;
          if (tier.type !== "table") {
            feeBase += chargeAmount * qty;
          }
        }
      });
    }

    const feePercentage = (event.bookingFeePercent || 10) / 100;
    const processingFee = feeBase > 0 ? Math.round(feeBase * feePercentage) : 0;
    let discount = 0;

    if (promoApplied) {
      const discountBase = subtotalCharged;
      switch (promoApplied.discountType) {
        case "free":
          discount = discountBase;
          break;
        case "percent":
          discount = Math.round(
            discountBase * (promoApplied.discountValue / 100)
          );
          break;
        case "fixed":
          discount = Math.min(promoApplied.discountValue, discountBase);
          break;
      }
    }

    const finalTotal = Math.max(0, subtotalCharged - discount + processingFee);

    setPricing({
      subtotal: subtotalCharged,
      feeBase,
      processingFee,
      discount,
      total: finalTotal,
    });
  }, [
    orderType,
    event,
    selectedSeats,
    selectedTiers,
    ticketTiers,
    promoApplied,
  ]);

  // --- All other functions (validatePromoCode, form validation, etc.) remain largely the same ---
  const validatePromoCode = async () => {
    if (!promoCode.trim() || !eventId) return;
    setPromoValidating(true);
    try {
      const upperCode = promoCode.trim().toUpperCase();
      const promoQuery = query(
        collection(db, "promoCodes"),
        where("eventId", "==", eventId),
        where("code", "==", upperCode)
      );
      const snapshot = await getDocs(promoQuery);
      if (snapshot.empty) {
        setPromoApplied(null);
        Alert.alert(
          "Invalid Code",
          "This promo code is not valid for this event."
        );
        return;
      }
      const promoDoc = snapshot.docs[0];
      const promoData = {
        id: promoDoc.id,
        ...promoDoc.data(),
      } as PromoCodeData;
      if (!promoData.isActive) {
        setPromoApplied(null);
        Alert.alert("Code Inactive", "This promo code is no longer active.");
        return;
      }
      if (promoData.currentRedemptions >= promoData.maxRedemptions) {
        setPromoApplied(null);
        Alert.alert(
          "Code Expired",
          "This promo code has reached its usage limit."
        );
        return;
      }
      setPromoApplied(promoData);
      Alert.alert(
        "Promo Applied!",
        promoData.discountType === "free"
          ? "Your order will be free!"
          : promoData.discountType === "percent"
          ? `${promoData.discountValue}% discount applied!`
          : `${getCurrencySymbol(event?.currency || "INR")} ${
              promoData.discountValue
            } discount applied!`
      );
    } catch (error: any) {
      console.error("Error validating promo:", error);
      Alert.alert("Error", "Failed to validate promo code. Please try again.");
      setPromoApplied(null);
    } finally {
      setPromoValidating(false);
    }
  };
  const hasTableBooking = useMemo(
    () =>
      orderType === "regular" &&
      ticketTiers.length > 0 &&
      Object.keys(selectedTiers).some((tierId) => {
        const tier = ticketTiers.find((t) => t.id === tierId);
        return tier && tier.type === "table" && selectedTiers[tierId] > 0;
      }),
    [orderType, selectedTiers, ticketTiers]
  );

  const isTableContactFormValid = useMemo(() => {
    if (!hasTableBooking) return true;
    return (
      tableContactDetails.fullName.trim() !== "" &&
      tableContactDetails.email.trim() !== "" &&
      tableContactDetails.phone.trim() !== ""
    );
  }, [hasTableBooking, tableContactDetails]);

  const areAttendeeDetailsValid = useMemo(
    () =>
      orderType === "movie" ||
      attendees.every(
        (attendee) =>
          attendee.name.trim() !== "" &&
          attendee.email.trim() !== "" &&
          attendee.phone.trim() !== ""
      ),
    [orderType, attendees]
  );
  const hasSelection =
    (orderType === "movie" && selectedSeats.length > 0) ||
    (orderType === "regular" && Object.values(selectedTiers).some(qty => qty > 0));
  const canProceed =
    hasSelection &&
    agreedToTerms &&
    !isProcessing &&
    isTableContactFormValid &&
    areAttendeeDetailsValid;

  // --- UNIFIED PAYMENT HANDLER ---
  const handlePayment = async () => {
    if (!canProceed) {
      let message =
        "Please fill out all required fields and agree to the terms.";
      if (!hasSelection) {
        message = "Your cart is empty.";
      } else if (!agreedToTerms) {
        message = "Please agree to the terms of service.";
      }
      Alert.alert("Incomplete Information", message);
      return;
    }
    setIsProcessing(true);

    if (event?.currency === "INR" && orderType !== "movie") {
      // Razorpay for regular INR orders
      await handleRazorpayPayment();
    } else {
      // Stripe for all movie orders and international regular orders
      await handleStripePayment();
    }

    setIsProcessing(false);
  };

  const handleStripePayment = async () => {
    if (!event || !orderType) return;

    try {
      // Determine payload based on order type
      const payload =
        orderType === "movie"
          ? {
              orderType: "movie",
              eventId: eventIdStr,
              items: selectedSeats.map((s) => s.id), // Send seat IDs
              total: pricing.total,
              currency: event.currency,
              promoCode: promoApplied ? promoApplied.code : undefined,
            }
          : {
              orderType: "regular",
              eventId: eventIdStr,
              items: selectedTiers,
              total: pricing.total,
              currency: event.currency,
              promoCode: promoApplied ? promoApplied.code : undefined,
              attendees: attendees.length > 0 ? attendees : undefined,
            };

      const { clientSecret, orderId, free } = await createOrder(payload as any);

      // This part remains mostly the same, just handling the result
      if (hasTableBooking && orderId) {
        const updateOrderContact = httpsCallable(
          functions,
          "updateOrderContactDetails"
        );
        await updateOrderContact({
          orderId,
          contactDetails: tableContactDetails,
        });
      }

      if (free) {
        router.push({
          pathname: "/(ticket)/PurchaseConfirmationScreen",
          params: { orderId },
        });
        return;
      }

      if (!clientSecret)
        throw new Error("Payment intent not created successfully.");

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Grid",
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL: "https://grideventsapp.com",
      });
      if (initError)
        throw new Error(
          `Failed to initialize payment sheet: ${initError.message}`
        );

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") {
          throw new Error(`Payment failed: ${presentError.message}`);
        }
      } else {
        router.push({
          pathname: "/(ticket)/PurchaseConfirmationScreen",
          params: { orderId },
        });
      }
    } catch (error) {
      console.error("Stripe Payment error:", error);
      Alert.alert(
        "Payment Failed",
        (error as any).message || "Unable to process your order."
      );
    }
  };

  const handleRazorpayPayment = async () => {
    // This remains for regular, INR orders only.
    try {
      const createRazorpayOrder = httpsCallable(
        functions,
        "createRazorpayOrder"
      );
      const res = await createRazorpayOrder({
        eventId: eventIdStr,
        selectedTiers,
        promoCode: promoApplied ? promoApplied.code : undefined,
        attendees: attendees.length > 0 ? attendees : undefined,
      });

      const { orderId, razorpayOrderId, amount, currency, free } =
        res.data as any;

      if (hasTableBooking) {
        const updateOrderContact = httpsCallable(
          functions,
          "updateOrderContactDetails"
        );
        await updateOrderContact({
          orderId,
          contactDetails: tableContactDetails,
        });
      }

      if (free) {
        router.push({
          pathname: "/(ticket)/PurchaseConfirmationScreen",
          params: { orderId },
        });
        return;
      }

      if (!razorpayOrderId)
        throw new Error("Razorpay order not created successfully.");

      const options = {
        description: `Payment for ${event?.title}`,
        image: event?.coverImageUrl || "https://grideventsapp.com/icon.png",
        currency: currency,
        key: razorpay_api_key,
        amount: amount,
        name: "Grid",
        order_id: razorpayOrderId,
        prefill: {
          email: tableContactDetails.email || attendees[0]?.email || "",
          contact: tableContactDetails.phone || attendees[0]?.phone || "",
          name: tableContactDetails.fullName || attendees[0]?.name || "",
        },
        theme: { color: "#4a90e2" },
      };

      RazorpayCheckout.open(options)
        .then(() => {
          router.push({
            pathname: "/(ticket)/PurchaseConfirmationScreen",
            params: { orderId },
          });
        })
        .catch((error) => {
          if (error.code !== 1) {
            // 1 is cancellation by user
            Alert.alert("Payment Failed", `Error: ${error.description}`);
          }
        });
    } catch (error) {
      console.error("Razorpay payment error:", error);
      Alert.alert(
        "Payment Failed",
        (error as any).message || "Unable to process your order."
      );
    }
  };
  // --- Loading and Not Found States ---

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

  const currencySymbol = getCurrencySymbol(event.currency);

  // --- RENDER ---
  return (
    <ThemedView style={styles.container}>
      <TopNavBar title="Order Summary" onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {orderType === "movie" && (
          <OrderSummaryCard
            event={event}
            selectedSeats={selectedSeats}
            pricing={pricing}
            currencySymbol={currencySymbol}
          />
        )}

        {orderType === "regular" && (
          <View style={styles.summaryCard}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {Object.keys(selectedTiers).map((tierId) => {
              const tier = ticketTiers.find((t) => t.id === tierId);
              if (!tier || selectedTiers[tierId] === 0) return null;
              const displayAmount =
                tier.type === "table" && tier.chargeAmount != null
                  ? tier.chargeAmount
                  : tier.price;
              return (
                <View key={tierId} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {tier.name} x {selectedTiers[tierId]}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {currencySymbol}
                    {(displayAmount * selectedTiers[tierId]).toLocaleString()}
                  </Text>
                </View>
              );
            })}
            <View style={styles.subtotalContainer}>
              <Text style={styles.summaryText}>Subtotal</Text>
              <Text style={styles.summaryText}>
                {currencySymbol}
                {pricing.subtotal.toLocaleString()}
              </Text>
            </View>
            {pricing.processingFee > 0 && (
              <View style={styles.subtotalContainer}>
                <Text style={styles.summaryText}>
                  Processing fee ({event.bookingFeePercent}%)
                </Text>
                <Text style={styles.summaryText}>
                  {currencySymbol}
                  {pricing.processingFee.toLocaleString()}
                </Text>
              </View>
            )}
            {pricing.discount > 0 && (
              <View style={styles.subtotalContainer}>
                <Text style={[styles.summaryText, { color: "#4CAF50" }]}>
                  Discount
                </Text>
                <Text style={[styles.summaryText, { color: "#4CAF50" }]}>
                  -{currencySymbol}
                  {pricing.discount.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalText}>
                {currencySymbol}
                {pricing.total.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {orderType === "regular" && hasTableBooking && (
          <View style={styles.attendeeSection}>
            <Text style={styles.sectionTitle}>Table Contact Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={tableContactDetails.fullName}
              onChangeText={(text) =>
                setTableContactDetails((p) => ({ ...p, fullName: text }))
              }
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={tableContactDetails.email}
              onChangeText={(text) =>
                setTableContactDetails((p) => ({ ...p, email: text }))
              }
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={tableContactDetails.phone}
              onChangeText={(text) =>
                setTableContactDetails((p) => ({ ...p, phone: text }))
              }
              keyboardType="phone-pad"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Notes (Optional)"
              value={tableContactDetails.notes || ""}
              onChangeText={(text) =>
                setTableContactDetails((p) => ({ ...p, notes: text }))
              }
              placeholderTextColor="#888"
            />
          </View>
        )}

        {orderType === "regular" && attendees.length > 0 && (
          <View style={styles.attendeeSection}>
            <Text style={styles.sectionTitle}>Attendee Details</Text>
            {attendees.map((attendee, index) => (
              <View key={index} style={styles.attendeeInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={`Ticket ${index + 1} - Full Name *`}
                  value={attendee.name}
                  onChangeText={(name) => {
                    const newAttendees = [...attendees];
                    newAttendees[index] = { ...newAttendees[index], name };
                    setAttendees(newAttendees);
                  }}
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder={`Ticket ${index + 1} - Email *`}
                  value={attendee.email}
                  onChangeText={(email) => {
                    const newAttendees = [...attendees];
                    newAttendees[index] = { ...newAttendees[index], email };
                    setAttendees(newAttendees);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#888"
                />
                <TextInput
                  style={styles.input}
                  placeholder={`Ticket ${index + 1} - Phone Number *`}
                  value={attendee.phone}
                  onChangeText={(phone) => {
                    const newAttendees = [...attendees];
                    newAttendees[index] = { ...newAttendees[index], phone };
                    setAttendees(newAttendees);
                  }}
                  keyboardType="phone-pad"
                  placeholderTextColor="#888"
                />
              </View>
            ))}
          </View>
        )}

        {/* Common Sections: Promo, Terms, and CTA */}
        <View style={styles.promoSection}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoInputContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter promo code"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
              placeholderTextColor="#888"
              editable={!promoValidating && !promoApplied}
            />
            {promoApplied ? (
              <TouchableOpacity
                onPress={() => {
                  setPromoCode("");
                  setPromoApplied(null);
                }}
                style={styles.promoButton}
              >
                <Text style={styles.promoButtonText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={validatePromoCode}
                style={styles.promoButton}
                disabled={promoValidating || !promoCode.trim()}
              >
                {promoValidating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.promoButtonText}>Apply</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.termsContainer}>
          <TouchableOpacity
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            style={styles.checkbox}
          >
            {agreedToTerms && <Feather name="check" size={18} color="#fff" />}
          </TouchableOpacity>
          <Text style={styles.termsText}>
            I agree to the Terms of Service and understand all sales are final.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, !canProceed && styles.disabledButton]}
          onPress={handlePayment}
          disabled={!canProceed}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaButtonText}>
              {pricing.total === 0 ? "Complete Order" : "Proceed to Payment"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 10 },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  scrollContent: { paddingTop: 10, paddingBottom: 40 },
  text: { color: "#fff", fontSize: 18, textAlign: "center" },
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
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: { color: "#ddd", fontSize: 16, flexShrink: 1 },
  itemPrice: { color: "#ddd", fontSize: 16, fontWeight: "500" },
  summaryText: { color: "#aaa", fontSize: 16 },
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
  totalText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  termsText: { color: "#aaa", fontSize: 12, flex: 1 },
  ctaButton: {
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  disabledButton: { opacity: 0.5 },
  attendeeSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  attendeeInputContainer: {
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#2c2c2e",
    paddingTop: 15,
  },
  input: {
    backgroundColor: "#2c2c2e",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  promoSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  promoInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promoInput: {
    flex: 1,
    backgroundColor: "#2c2c2e",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  promoButton: {
    paddingHorizontal: 15,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4a90e2",
    borderRadius: 8,
  },
  promoButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default CheckoutScreen;
