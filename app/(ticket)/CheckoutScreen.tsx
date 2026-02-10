
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
import { Event, TableContactDetails, TicketTier } from "../../types/event";

// Add PromoCodeData interface
interface PromoCodeData {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed' | 'free';
  discountValue: number;
  maxRedemptions: number;
  currentRedemptions: number;
  isActive: boolean;
  eventId: string;
}


const getCurrencySymbol = (currency: string) => {
    switch (currency) {
        case 'INR': return '₹';
        case 'USD': return '$';
        default: return '₹';
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
  const [pricing, setPricing] = useState({ subtotal: 0, feeBase: 0, processingFee: 0, total: 0, discount: 0 });

  const [attendees, setAttendees] = useState<{ name: string; email: string; phone: string; }[]>([]);
  const [tableContactDetails, setTableContactDetails] = useState<TableContactDetails>({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<PromoCodeData | null>(null);
  const [promoValidating, setPromoValidating] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!eventIdStr || !selectedTiersJSON) {
      setLoading(false);
      return;
    }
    try {
      setSelectedTiers(JSON.parse(selectedTiersJSON as string));
    } catch (e) {
      console.error("Invalid JSON from params:", e);
      setLoading(false);
    }

    const fetchEventAndTiers = async () => {
      setLoading(true);
      try {
        const eventRef = doc(db, "events", eventIdStr);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          const eventData = { id: eventSnap.id, ...eventSnap.data() } as Event;
          setEvent({
            ...eventData,
            currency: eventData.currency || 'INR',
            bookingFeePercent: eventData.bookingFeePercent || 10,
          });
        } else {
          throw new Error("Event not found.");
        }

        const tiersRef = collection(db, "events", eventIdStr, "ticketTiers");
        const q = query(tiersRef, where("isActive", "==", true), orderBy("sortOrder"));
        const tiersSnap = await getDocs(q);
        setTicketTiers(tiersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as TicketTier)));

      } catch (error) {
        console.error("Error fetching checkout data:", error);
        Alert.alert("Error", (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchEventAndTiers();
  }, [eventIdStr, selectedTiersJSON]);

  useEffect(() => {
    if (ticketTiers.length === 0) return;

    const individualTicketCount = Object.entries(selectedTiers).reduce((acc, [tierId, qty]) => {
        const tier = ticketTiers.find(t => t.id === tierId);
        if (tier && tier.type === 'ticket') {
            return acc + (typeof qty === 'number' ? qty : 0);
        }
        return acc;
    }, 0);

    setAttendees(Array(individualTicketCount).fill({ name: '', email: '', phone: '' }));
  }, [selectedTiers, ticketTiers]);

  useEffect(() => {
    if (!event || ticketTiers.length === 0) return;

    const getChargeAmount = (tier: TicketTier): number => {
        if (tier.type === 'table' && tier.chargeAmount != null) return tier.chargeAmount;
        return tier.price;
    };

    let subtotalCharged = 0;
    let feeBase = 0;
    Object.entries(selectedTiers).forEach(([tierId, qty]) => {
        const tier = ticketTiers.find(t => t.id === tierId);
        if (tier && typeof qty === 'number' && qty > 0) {
            const chargeAmount = getChargeAmount(tier);
            subtotalCharged += chargeAmount * qty;
            if (tier.type !== 'table') {
                feeBase += chargeAmount * qty;
            }
        }
    });

    const feePercentage = event.bookingFeePercent / 100;
    const processingFee = feeBase > 0 ? Math.round(feeBase * feePercentage) : 0;

    // Calculate discount
    let discount = 0;
    if (promoApplied) {
      // The discount should apply to the subtotal ONLY, not the processing fee.
      const discountBase = subtotalCharged;
      switch (promoApplied.discountType) {
        case 'free':
          // "Free" promo should waive the subtotal. The processing fee may still apply.
          discount = discountBase;
          break;
        case 'percent':
          discount = Math.round(discountBase * (promoApplied.discountValue / 100));
          break;
        case 'fixed':
          discount = Math.min(promoApplied.discountValue, discountBase);
          break;
      }
    }

    // Final total is subtotal - discount + fee
    const finalTotal = Math.max(0, subtotalCharged - discount + processingFee);

    setPricing({
      subtotal: subtotalCharged,
      feeBase,
      processingFee,
      discount,
      total: finalTotal
    });
  }, [selectedTiers, ticketTiers, event, promoApplied]);

  const validatePromoCode = async () => {
    if (!promoCode.trim() || !eventId) {
      return;
    }

    setPromoValidating(true);
    try {
      const upperCode = promoCode.trim().toUpperCase();
      const promoQuery = query(
        collection(db, 'promoCodes'),
        where('eventId', '==', eventId),
        where('code', '==', upperCode)
      );
      const snapshot = await getDocs(promoQuery);

      if (snapshot.empty) {
        setPromoApplied(null);
        Alert.alert("Invalid Code", "This promo code is not valid for this event.");
        return;
      }

      const promoDoc = snapshot.docs[0];
      const promoData = { id: promoDoc.id, ...promoDoc.data() } as PromoCodeData;

      if (!promoData.isActive) {
        setPromoApplied(null);
        Alert.alert("Code Inactive", "This promo code is no longer active.");
        return;
      }

      if (promoData.currentRedemptions >= promoData.maxRedemptions) {
        setPromoApplied(null);
        Alert.alert("Code Expired", "This promo code has reached its usage limit.");
        return;
      }

      setPromoApplied(promoData);
      Alert.alert(
        "Promo Applied!",
        promoData.discountType === 'free'
          ? "Your order will be free!"
          : promoData.discountType === 'percent'
            ? `${promoData.discountValue}% discount applied!`
            : `${getCurrencySymbol(event?.currency || 'INR')} ${promoData.discountValue} discount applied!`
      );
    } catch (error: any) {
      console.error("Error validating promo:", error);
      if (error?.message?.includes('index')) {
        Alert.alert("Configuration Error", "Promo codes are not configured correctly. Please contact support.");
      } else {
        Alert.alert("Error", "Failed to validate promo code. Please try again.");
      }
      setPromoApplied(null);
    } finally {
      setPromoValidating(false);
    }
  };

  const hasTableBooking = useMemo(() =>
    ticketTiers.length > 0 && Object.keys(selectedTiers).some(tierId => {
        const tier = ticketTiers.find(t => t.id === tierId);
        return tier && tier.type === 'table' && selectedTiers[tierId] > 0;
    }),
  [selectedTiers, ticketTiers]);

  const isTableContactFormValid = useMemo(() => {
    if (!hasTableBooking) return true;
    return tableContactDetails.fullName.trim() !== '' &&
           tableContactDetails.email.trim() !== '' &&
           tableContactDetails.phone.trim() !== '';
  }, [hasTableBooking, tableContactDetails]);

  const areAttendeeDetailsValid = useMemo(() =>
    attendees.every(attendee => attendee.name.trim() !== '' && attendee.email.trim() !== '' && attendee.phone.trim() !== ''),
  [attendees]);

  const hasSelection = Object.keys(selectedTiers).length > 0;
  const canProceed = hasSelection && agreedToTerms && !isProcessing && isTableContactFormValid && areAttendeeDetailsValid;

  const handlePayment = async () => {
    if (!canProceed) {
        Alert.alert("Incomplete Information", "Please fill out all required fields and agree to the terms.");
        return;
    }
    setIsProcessing(true);

    try {
      const createPaymentIntent = httpsCallable(functions, "createPaymentIntent");
      const res = await createPaymentIntent({
          eventId: eventIdStr,
          selectedTiers,
          promoCode: promoApplied ? promoApplied.code : undefined, // Pass applied promo code
          attendees: attendees.length > 0 ? attendees : undefined,
          tableContactDetails: hasTableBooking ? tableContactDetails : undefined,
      });

      const { orderId, clientSecret, free } = res.data as any;

      if (free) {
          router.push({ pathname: "/(ticket)/PurchaseConfirmationScreen", params: { orderId } });
          return;
      }

      if (!clientSecret) throw new Error("Payment intent not created successfully.");

      const { error: initError } = await initPaymentSheet({
          merchantDisplayName: "Grid",
          paymentIntentClientSecret: clientSecret,
          allowsDelayedPaymentMethods: true,
          returnURL: 'https://grideventsapp.com',
      });
      if (initError) throw new Error(`Failed to initialize payment sheet: ${initError.message}`);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
          if (presentError.code !== 'Canceled') {
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

  if (loading) return <ThemedView style={styles.centeredContainer}><ActivityIndicator size="large" color="#fff" /></ThemedView>;
  if (!event) return <ThemedView style={styles.centeredContainer}><Text style={styles.text}>Event not found.</Text></ThemedView>;

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
                  const displayAmount = (tier.type === 'table' && tier.chargeAmount != null) ? tier.chargeAmount : tier.price;
                  return (
                      <View key={tierId} style={styles.itemRow}>
                          <Text style={styles.itemName}>{tier.name} x {selectedTiers[tierId]}</Text>
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
                {pricing.discount > 0 && (
                    <View style={styles.subtotalContainer}>
                        <Text style={[styles.summaryText, { color: '#4CAF50' }]}>Discount</Text>
                        <Text style={[styles.summaryText, { color: '#4CAF50' }]}>-{currencySymbol}{pricing.discount.toLocaleString()}</Text>
                    </View>
                )}
                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Total</Text>
                    <Text style={styles.totalText}>{currencySymbol}{pricing.total.toLocaleString()}</Text>
                </View>
            </View>

            {hasTableBooking && (
              <View style={styles.attendeeSection}>
                <Text style={styles.sectionTitle}>Table Contact Details</Text>
                <TextInput style={styles.input} placeholder="Full Name *" value={tableContactDetails.fullName} onChangeText={(text) => setTableContactDetails(p => ({...p, fullName: text}))} placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Email *" value={tableContactDetails.email} onChangeText={(text) => setTableContactDetails(p => ({...p, email: text}))} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Phone Number *" value={tableContactDetails.phone} onChangeText={(text) => setTableContactDetails(p => ({...p, phone: text}))} keyboardType="phone-pad" placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Notes (Optional)" value={tableContactDetails.notes || ''} onChangeText={(text) => setTableContactDetails(p => ({...p, notes: text}))} placeholderTextColor="#888" />
              </View>
            )}

            {attendees.length > 0 && (
              <View style={styles.attendeeSection}>
                <Text style={styles.sectionTitle}>Attendee Details</Text>
                {attendees.map((attendee, index) => (
                  <View key={index} style={styles.attendeeInputContainer}>
                    <TextInput style={styles.input} placeholder={`Ticket ${index + 1} - Full Name *`} value={attendee.name} onChangeText={(name) => {
                        const newAttendees = [...attendees];
                        newAttendees[index] = { ...newAttendees[index], name };
                        setAttendees(newAttendees);
                      }} placeholderTextColor="#888" />
                    <TextInput style={styles.input} placeholder={`Ticket ${index + 1} - Email *`} value={attendee.email} onChangeText={(email) => {
                        const newAttendees = [...attendees];
                        newAttendees[index] = { ...newAttendees[index], email };
                        setAttendees(newAttendees);
                      }} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#888" />
                    <TextInput style={styles.input} placeholder={`Ticket ${index + 1} - Phone Number *`} value={attendee.phone} onChangeText={(phone) => {
                        const newAttendees = [...attendees];
                        newAttendees[index] = { ...newAttendees[index], phone };
                        setAttendees(newAttendees);
                      }} keyboardType="phone-pad" placeholderTextColor="#888" />
                  </View>
                ))}
              </View>
            )}

            {/* Promo Code Section */}
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
                      <TouchableOpacity onPress={() => { setPromoCode(''); setPromoApplied(null); }} style={styles.promoButton}>
                          <Text style={styles.promoButtonText}>Remove</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={validatePromoCode} style={styles.promoButton} disabled={promoValidating || !promoCode.trim()}>
                          {promoValidating ? <ActivityIndicator color="#fff" /> : <Text style={styles.promoButtonText}>Apply</Text>}
                      </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.termsContainer}>
                <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.checkbox}>
                    {agreedToTerms && <Feather name="check" size={18} color="#fff" />}
                </TouchableOpacity>
                 <Text style={styles.termsText}>I agree to the Terms of Service and understand all sales are final.</Text>
            </View>

            <TouchableOpacity style={[styles.ctaButton, !canProceed && styles.disabledButton]} onPress={handlePayment} disabled={!canProceed}>
                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaButtonText}>{pricing.total === 0 ? 'Complete Order' : 'Proceed to Payment'}</Text>}
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
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  itemName: { color: '#ddd', fontSize: 16, flexShrink: 1 },
  itemPrice: { color: '#ddd', fontSize: 16, fontWeight: '500' },
  summaryText: { color: "#aaa", fontSize: 16 },
  subtotalContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  totalContainer: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 15, marginTop: 15 },
  totalText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, paddingHorizontal: 5 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: '#888', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  termsText: { color: '#aaa', fontSize: 12, flex: 1 },
  ctaButton: { backgroundColor: "#4a90e2", borderRadius: 10, paddingVertical: 15, alignItems: "center" },
  ctaButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  disabledButton: { opacity: 0.5 },
  attendeeSection: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 20, marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  attendeeInputContainer: { marginBottom: 10, borderTopWidth: 1, borderTopColor: '#2c2c2e', paddingTop: 15 },
  input: { backgroundColor: '#2c2c2e', color: '#fff', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 10 },
  promoSection: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 20, marginBottom: 20 },
  promoInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promoInput: { flex: 1, backgroundColor: '#2c2c2e', color: '#fff', borderRadius: 8, padding: 12, fontSize: 16, marginRight: 10 },
  promoButton: { paddingHorizontal: 15, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4a90e2', borderRadius: 8 },
  promoButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default CheckoutScreen;
