
import { Feather } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
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
  View
} from "react-native";
import TopNavBar from "../../components/TopNavBar";
import { ThemedView } from "../../components/themed-view";
import { db } from "../../lib/firebase/firebaseConfig";
import { Event, TicketTier } from "../../types/event";

// Helper to get currency symbol
const getCurrencySymbol = (currency: string) => {
    switch (currency) {
        case 'INR':
            return '₹';
        case 'USD':
            return '$';
        default:
            return '₹'; // Default to INR
    }
};

const CheckoutScreen = () => {
  const { eventId, selectedTiers: selectedTiersJSON } = useLocalSearchParams();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const functions = useMemo(() => getFunctions(), []);

  const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>({});
  const [pricing, setPricing] = useState({ subtotal: 0, feeBase: 0, processingFee: 0, total: 0 });
  const [attendees, setAttendees] = useState<{ name: string; email: string; }[]>([]);
  
  const [promoCode, setPromoCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const total = pricing.total;

  const hasSelection = Object.keys(selectedTiers).length > 0;
  const isFreeOrder = total === 0;

  useEffect(() => {
    if (!eventIdStr || !selectedTiersJSON) {
      setLoading(false);
      return;
    }

    try {
      const parsedSelectedTiers = JSON.parse(selectedTiersJSON as string);
      setSelectedTiers(parsedSelectedTiers);
      const totalTickets = Object.values(parsedSelectedTiers).reduce((acc: number, val: unknown) => acc + (typeof val === 'number' ? val : 0), 0);
      setAttendees(Array(totalTickets).fill({ name: '', email: '' }));
    } catch (e) {
      console.error("Invalid JSON from params:", e);
      setLoading(false);
      return;
    }

    const fetchEventAndTiers = async () => {
      setLoading(true);
      try {
        const eventRef = doc(db, "events", eventIdStr);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const eventData = { id: eventSnap.id, ...eventSnap.data() } as Event;
          eventData.currency = eventData.currency || 'INR';
          eventData.bookingFeePercent = eventData.bookingFeePercent || 10;
          setEvent(eventData);
        } else {
          throw new Error("Event not found.");
        }

        const tiersRef = collection(db, "events", eventIdStr, "ticketTiers");
        const q = query(tiersRef, where("isActive", "==", true), orderBy("sortOrder"));
        const tiersSnap = await getDocs(q);
        const tiers = tiersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TicketTier));
        setTicketTiers(tiers);

      } catch (error) {
        console.error("Error fetching checkout data:", error);
        Alert.alert("Error", (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndTiers();
  }, [eventIdStr, selectedTiersJSON]);

  // [NEW] Calculate pricing on the client-side for display purposes
  useEffect(() => {
    if (!event || ticketTiers.length === 0) return;

    const getChargeAmount = (tier: TicketTier): number => {
        if (tier.type === 'table' && tier.chargeAmount != null) {
          return tier.chargeAmount;
        }
        return tier.price;
    };

    let subtotalCharged = 0;
    let feeBase = 0;

    Object.entries(selectedTiers).forEach(([tierId, qty]) => {
        const tier = ticketTiers.find(t => t.id === tierId);
        const quantity = typeof qty === 'number' ? qty : 0;
        if (tier && quantity > 0) {
            const chargeAmount = getChargeAmount(tier);
            subtotalCharged += chargeAmount * quantity;
            if (tier.type !== 'table') {
                feeBase += chargeAmount * quantity;
            }
        }
    });

    const feePercentage = event.bookingFeePercent ? event.bookingFeePercent / 100 : 0.10;
    const processingFee = feeBase > 0 ? Math.round(feeBase * feePercentage) : 0;
    const total = subtotalCharged + processingFee;

    setPricing({ subtotal: subtotalCharged, feeBase, processingFee, total });
  }, [selectedTiers, ticketTiers, event]);


  const handlePayment = async () => {
    if (!agreedToTerms) {
        Alert.alert("Terms Required", "Please agree to the terms to continue.");
        return;
    }
    setIsProcessing(true);

    try {
      const createPaymentIntent = httpsCallable(functions, "createPaymentIntent");
      const res = await createPaymentIntent({ 
          eventId: eventIdStr, 
          selectedTiers, 
          promoCode: promoCode.trim().toUpperCase() || undefined,
          attendees,
      });

      const { orderId, clientSecret, free } = res.data as { 
          orderId: string; 
          clientSecret?: string;
          free?: boolean;
      };

      if (free) {
          router.push({ pathname: "/(ticket)/PurchaseConfirmationScreen", params: { orderId } });
          return;
      }
      
      if (!clientSecret) {
          throw new Error("Payment intent not created successfully.");
      }

      const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "Grid",
          paymentIntentClientSecret: clientSecret,
          allowsDelayedPaymentMethods: true,
          returnURL: 'https://grideventsapp.com',
      });

      if (initError) {
          throw new Error(`Failed to initialize payment sheet: ${initError.message}`);
      }
      
      const { error: presentError } = await presentPaymentSheet();
      
      if (presentError) {
          if (presentError.code === 'Canceled') {
              console.log("Payment cancelled by user.");
          } else {
              throw new Error(`Payment failed: ${presentError.message}`);
          }
      } else {
          router.push({ pathname: "/(ticket)/PurchaseConfirmationScreen", params: { orderId } });
      }

    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Payment Failed", (error as any).message || "Unable to process your order.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <ThemedView style={styles.centeredContainer}><ActivityIndicator size="large" color="#fff" /></ThemedView>;
  }

  if (!event) {
    return <ThemedView style={styles.centeredContainer}><Text style={styles.text}>Event not found.</Text></ThemedView>;
  }

  const currencySymbol = getCurrencySymbol(event.currency);

  return (
    <ThemedView style={styles.container}>
        <TopNavBar title="Order Summary" onBackPress={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.summaryCard}>
                <Text style={styles.eventTitle}>{event.title}</Text>

                {Object.keys(selectedTiers).map((tierId) => {
                  const tier = ticketTiers.find((t) => t.id === tierId);
                  if (!tier) return null;

                  const displayAmount = (tier.type === 'table' && tier.chargeAmount != null)
                    ? tier.chargeAmount
                    : tier.price;

                  return (
                      <View key={tierId} style={styles.itemRow}>
                          <View style={styles.itemDetails}>
                             <Text style={styles.itemName}>{tier.name} x {selectedTiers[tierId]}</Text>
                          </View>
                          <Text style={styles.itemPrice}>{currencySymbol}{(displayAmount * selectedTiers[tierId]).toLocaleString()}</Text>
                      </View>
                  );
                })}

                <View style={styles.subtotalContainer}><Text style={styles.summaryText}>Subtotal</Text><Text style={styles.summaryText}>{currencySymbol}{pricing.subtotal.toLocaleString()}</Text></View>

                {pricing.processingFee > 0 && (
                    <View style={styles.subtotalContainer}>
                        <Text style={styles.summaryText}>Processing fee ({event.bookingFeePercent}%)</Text>
                        <Text style={styles.summaryText}>{currencySymbol}{pricing.processingFee.toLocaleString()}</Text>
                    </View>
                )}

                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Total</Text>
                    <Text style={styles.totalText}>{currencySymbol}{total.toLocaleString()}</Text>
                </View>
            </View>

            {attendees.length > 0 && (
              <View style={styles.attendeeSection}>
                <Text style={styles.sectionTitle}>Attendee Details</Text>
                {attendees.map((attendee, index) => (
                  <View key={index} style={styles.attendeeInputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder={`Ticket ${index + 1} - Full Name`}
                      placeholderTextColor="#888"
                      value={attendee.name}
                      onChangeText={(name) => {
                        const newAttendees = [...attendees];
                        newAttendees[index] = { ...newAttendees[index], name };
                        setAttendees(newAttendees);
                      }}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={`Ticket ${index + 1} - Email`}
                      placeholderTextColor="#888"
                      value={attendee.email}
                      onChangeText={(email) => {
                        const newAttendees = [...attendees];
                        newAttendees[index] = { ...newAttendees[index], email };
                        setAttendees(newAttendees);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                ))}
              </View>
            )}

            <View style={styles.promoContainer}>
                <TextInput
                    style={styles.promoInput}
                    placeholder="Promo code (optional)"
                    placeholderTextColor="#888"
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                />
            </View>
            
            <View style={styles.termsContainer}>
                <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.checkbox}>
                    {agreedToTerms && <Feather name="check" size={18} color="#fff" />}
                </TouchableOpacity>
                 <Text style={styles.termsText}>I agree to the Terms of Service and understand all sales are final.</Text>
            </View>
            
            <TouchableOpacity
                style={[styles.ctaButton, (!hasSelection || !agreedToTerms || isProcessing) && styles.disabledButton]}
                onPress={handlePayment}
                disabled={!hasSelection || !agreedToTerms || isProcessing}
            >
                {isProcessing 
                    ? <ActivityIndicator color="#fff" /> 
                    : <Text style={styles.ctaButtonText}>{isFreeOrder ? 'Complete Order' : 'Proceed to Payment'}</Text>
                }
            </TouchableOpacity>
            
        </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding:10 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  scrollContent: { paddingTop: 10, paddingBottom: 40 },
  text: { color: "#fff", fontSize: 18, textAlign: "center" },
  summaryCard: { backgroundColor: "#1a1a1a", borderRadius: 10, padding: 20, marginBottom: 20 },
  eventTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", borderBottomWidth: 1, borderBottomColor: "#333", paddingBottom: 15, marginBottom: 15 },
  
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    color: '#ddd',
    fontSize: 16,
    flexShrink: 1,
  },
  itemPrice: {
    color: '#ddd',
    fontSize: 16,
    fontWeight: '500',
  },
  summaryText: { color: "#aaa", fontSize: 16 },

  subtotalContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  totalContainer: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 15, marginTop: 15 },
  totalText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  promoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  promoInput: { flex: 1, backgroundColor: "#1a1a1a", borderRadius: 8, color: "#fff", paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, paddingHorizontal: 5 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: '#888', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  termsText: { color: '#aaa', fontSize: 12, flex: 1 },
  ctaButton: { backgroundColor: "#4a90e2", borderRadius: 10, paddingVertical: 15, alignItems: "center" },
  ctaButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  disabledButton: { opacity: 0.6 },
  attendeeSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  attendeeInputContainer: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2c2c2e',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
});

export default CheckoutScreen;
