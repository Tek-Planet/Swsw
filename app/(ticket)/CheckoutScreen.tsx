
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
  const { eventId, selectedTiers: selectedTiersJSON } = useLocalSearchParams();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const functions = useMemo(() => getFunctions(), []);

  console.log(functions)

  const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>({});
  
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoized calculation for totals
  const { subtotal, processingFee, total } = useMemo(() => {
    if (!ticketTiers.length) return { subtotal: 0, processingFee: 0, total: 0 };
    
    let currentSubtotal = 0;
    let feeBase = 0;

    for (const tierId in selectedTiers) {
        const tier = ticketTiers.find((t) => t.id === tierId);
        if (tier) {
            const chargeAmount = tier.chargeAmount ?? tier.price;
            currentSubtotal += chargeAmount * selectedTiers[tierId];
             if (tier.type !== "table") {
                feeBase += chargeAmount * selectedTiers[tierId];
            }
        }
    }

    const fee = feeBase > 0 ? Math.round(feeBase * 0.1) : 0;
    const finalTotal = promoApplied ? 0 : currentSubtotal + fee;

    return { subtotal: currentSubtotal, processingFee: fee, total: finalTotal };
  }, [selectedTiers, ticketTiers, promoApplied]);

  const hasSelection = Object.keys(selectedTiers).length > 0;
  const isFreeOrder = total === 0;

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

  // Main payment handler
  const handlePayment = async () => {
    if (!agreedToTerms) {
        Alert.alert("Terms Required", "Please agree to the terms to continue.");
        return;
    }
    setIsProcessing(true);

    try {
      // Use the modern Payment Sheet flow
      const createPaymentIntent = httpsCallable(functions, "createPaymentIntent");
      const res = await createPaymentIntent({ 
          eventId: eventIdStr, 
          selectedTiers, 
          promoCode: promoCode.trim().toUpperCase() || undefined,
      });

      const { orderId, clientSecret, free, vip } = res.data as { 
          orderId: string; 
          clientSecret?: string;
          free?: boolean;
          vip?: boolean;
      };

      if (free || vip) {
          // If the order is free (e.g., VIP promo), skip payment and go to confirmation.
          router.push({ pathname: "/(ticket)/PurchaseConfirmationScreen", params: { orderId } });
          return;
      }

 
      
      if (!clientSecret) {
          throw new Error("Payment intent not created successfully.");
      }

      // 1. Initialize the Payment Sheet
      const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "Grid",
          paymentIntentClientSecret: clientSecret,
          allowsDelayedPaymentMethods: true,
          returnURL: 'https://grideventsapp.com', // Required for some payment methods
      });

      if (initError) {
          throw new Error(`Failed to initialize payment sheet: ${initError.message}`);
      }
      
      // 2. Present the Payment Sheet
      const { error: presentError } = await presentPaymentSheet();
      
      if (presentError) {
          if (presentError.code === 'Canceled') {
              // User cancelled the payment sheet.
              // Optional: You can call a function here to cancel the order on the backend.
              console.log("Payment cancelled by user.");
          } else {
              throw new Error(`Payment failed: ${presentError.message}`);
          }
      } else {
          // 3. Payment succeeded. Navigate to confirmation.
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
                  return (
                      <View key={tierId} style={styles.ticketItem}>
                          <Text style={styles.ticketText}>{tier.name} x {selectedTiers[tierId]}</Text>
                          <Text style={styles.ticketText}>₹{(tier.price * selectedTiers[tierId]).toLocaleString()}</Text>
                      </View>
                  );
                })}

                <View style={styles.subtotalContainer}><Text style={styles.ticketText}>Subtotal</Text><Text style={styles.ticketText}>₹{subtotal.toLocaleString()}</Text></View>

                {processingFee > 0 && !promoApplied && (
                    <View style={styles.subtotalContainer}>
                        <Text style={styles.ticketText}>Processing fee (10%)</Text>
                        <Text style={styles.ticketText}>₹{processingFee.toLocaleString()}</Text>
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
  ticketItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  ticketText: { color: "#aaa", fontSize: 16 },
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
