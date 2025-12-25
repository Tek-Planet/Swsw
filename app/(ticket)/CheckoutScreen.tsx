
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

const CheckoutScreen = () => {
  const { eventId, selectedTiers: selectedTiersJSON, pricing: pricingJSON } = useLocalSearchParams();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const functions = useMemo(() => getFunctions(), []);

  const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>({});
  const [pricing, setPricing] = useState({ subtotal: 0, feeBase: 0, processingFee: 0, total: 0 });
  
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const total = promoApplied ? 0 : pricing.total;

  const hasSelection = Object.keys(selectedTiers).length > 0;
  const isFreeOrder = total === 0;

  useEffect(() => {
    if (!eventIdStr || !selectedTiersJSON || !pricingJSON) {
      setLoading(false);
      return;
    }

    try {
      const parsedSelectedTiers = JSON.parse(selectedTiersJSON as string);
      setSelectedTiers(parsedSelectedTiers);

      const parsedPricing = JSON.parse(pricingJSON as string);
      setPricing(parsedPricing);
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
          setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
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
  }, [eventIdStr, selectedTiersJSON, pricingJSON]);

  // Main payment handler
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
          pricing, // Pass the correct pricing object
      });

      const { orderId, clientSecret, free, vip } = res.data as { 
          orderId: string; 
          clientSecret?: string;
          free?: boolean;
          vip?: boolean;
      };

      if (free || vip) {
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

  return (
    <ThemedView style={styles.container}>
        <TopNavBar title="Order Summary" onBackPress={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.summaryCard}>
                <Text style={styles.eventTitle}>{event.title}</Text>

                {Object.keys(selectedTiers).map((tierId) => {
                  const tier = ticketTiers.find((t) => t.id === tierId);
                  if (!tier) return null;

                  // Use chargeAmount for tables for correct line item display
                  const displayAmount = (tier.type === 'table' && tier.chargeAmount != null)
                    ? tier.chargeAmount
                    : tier.price;

                  return (
                      <View key={tierId} style={styles.itemRow}>
                          <View style={styles.itemDetails}>
                             <Text style={styles.itemName}>{tier.name} x {selectedTiers[tierId]}</Text>
                          </View>
                          <Text style={styles.itemPrice}>₹{(displayAmount * selectedTiers[tierId]).toLocaleString()}</Text>
                      </View>
                  );
                })}

                <View style={styles.subtotalContainer}><Text style={styles.summaryText}>Subtotal</Text><Text style={styles.summaryText}>₹{pricing.subtotal.toLocaleString()}</Text></View>

                {pricing.processingFee > 0 && !promoApplied && (
                    <View style={styles.subtotalContainer}>
                        <Text style={styles.summaryText}>Processing fee (10%)</Text>
                        <Text style={styles.summaryText}>₹{pricing.processingFee.toLocaleString()}</Text>
                    </View>
                )}
                {promoApplied && <Text style={styles.promoAppliedText}>🎉 VIP promo applied!</Text>}

                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Total</Text>
                    <Text style={styles.totalText}>₹{total.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.promoContainer}>
                <TextInput
                    style={styles.promoInput}
                    placeholder="Promo code (optional)"
                    placeholderTextColor="#888"
                    value={promoCode}
                    onChangeText={(text) => {
                        setPromoCode(text);
                        setPromoApplied(text.trim().toUpperCase() === "GRIDVIP2207");
                    }}
                    autoCapitalize="characters"
                />
                {promoApplied && <Text style={styles.promoAppliedCheck}>✓</Text>}
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
    alignItems: 'flex-start', // Use flex-start to align items at the top
    marginBottom: 12,
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    color: '#ddd',
    fontSize: 16,
    flexShrink: 1, // This is crucial to allow text to wrap
  },
  itemPrice: {
    color: '#ddd',
    fontSize: 16,
    fontWeight: '500',
  },
  summaryText: { color: "#aaa", fontSize: 16 },

  subtotalContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  promoAppliedText: { color: '#4CAF50', fontSize: 16, textAlign: 'center', marginVertical: 10 },
  totalContainer: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 15, marginTop: 15 },
  totalText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  promoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  promoInput: { flex: 1, backgroundColor: "#1a1a1a", borderRadius: 8, color: "#fff", paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  promoAppliedCheck: { color: '#4CAF50', fontSize: 24, marginLeft: 10 },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, paddingHorizontal: 5 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: '#888', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  termsText: { color: '#aaa', fontSize: 12, flex: 1 },
  ctaButton: { backgroundColor: "#4a90e2", borderRadius: 10, paddingVertical: 15, alignItems: "center" },
  ctaButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  disabledButton: { opacity: 0.6 },
});

export default CheckoutScreen;
