import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/firebaseConfig';
import { Event, TicketTier } from '../../types/event';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useStripe, StripeProvider } from '@stripe/stripe-react-native';

const CheckoutScreenContent = () => {
  const { eventId, selectedTiers: selectedTiersJSON } = useLocalSearchParams();
  const router = useRouter();
  const functions = getFunctions();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);

  useEffect(() => {
    if (!eventId || !selectedTiersJSON) {
      setLoading(false);
      return;
    }

    const parsedSelectedTiers = JSON.parse(selectedTiersJSON as string);
    setSelectedTiers(parsedSelectedTiers);

    const fetchEventAndTiers = async () => {
      try {
        const eventRef = doc(db, 'events', eventId as string);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
        }

        const tiersRef = collection(db, 'events', eventId as string, 'ticketTiers');
        const q = query(tiersRef, where('isActive', '==', true), orderBy('sortOrder'));
        const tiersSnap = await getDocs(q);
        const tiers = tiersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketTier));
        setTicketTiers(tiers);

        let total = 0;
        for (const tierId in parsedSelectedTiers) {
          const tier = tiers.find(t => t.id === tierId);
          if (tier) {
            total += tier.price * parsedSelectedTiers[tierId];
          }
        }
        setTotalPrice(total);
        await initializePaymentSheet(total);
      } catch (error) {
        console.error("Error fetching checkout data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndTiers();
  }, [eventId, selectedTiersJSON]);

  const initializePaymentSheet = async (amount: number) => {
    const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
    try {
      const { data } = await createPaymentIntent({ amount: amount * 100 }); // amount in cents
      const { clientSecret, ephemeralKey, customer } = data as {clientSecret: string, ephemeralKey: string, customer: string};

      const { error } = await initPaymentSheet({
        merchantDisplayName: "TekPlanet, Inc.",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
      });

      if (!error) {
        setPaymentSheetReady(true);
      }
    } catch (e) {
      console.error('Error initializing payment sheet:', e);
    }
  };

  const handlePayment = async () => {
    if (!paymentSheetReady) return;

    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error: ${error.code}`, error.message);
    } else {
      Alert.alert('Success', 'Your order is confirmed!');
      router.push({
        pathname: '/(ticket)/PurchaseConfirmationScreen',
        params: { eventId: eventId as string },
      });
    }
  };

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  if (!event) {
    return <View style={styles.container}><Text style={styles.text}>Event not found.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order Summary</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        {Object.keys(selectedTiers).map(tierId => {
          const tier = ticketTiers.find(t => t.id === tierId);
          const quantity = selectedTiers[tierId];
          if (!tier) return null;
          return (
            <View key={tierId} style={styles.ticketItem}>
              <Text style={styles.ticketText}>{tier.name} x {quantity}</Text>
              <Text style={styles.ticketText}>₹{(tier.price * quantity).toLocaleString()}</Text>
            </View>
          );
        })}
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>₹{totalPrice.toLocaleString()}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.ctaButton} onPress={handlePayment} disabled={!paymentSheetReady}>
        <Text style={styles.ctaButtonText}>Pay with Card</Text>
      </TouchableOpacity>
    </View>
  );
};

const CheckoutScreen = () => {
  // Replace with your actual publishable key
  const publishableKey = 'pk_test_51PbyHEBDI5aFNBRO2sRqb832vC7FqN9aR3j2p4nQJg8Z8d6wR8gL2l3f7qJ7e5fF3b2nO9k0vY6aZ5Q00zJ4bY9cI'; 

  return (
    <StripeProvider publishableKey={publishableKey}>
      <CheckoutScreenContent />
    </StripeProvider>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 15,
    marginBottom: 15,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ticketText: {
    color: '#aaa',
    fontSize: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 15,
    marginTop: 15,
  },
  totalText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ctaButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;
