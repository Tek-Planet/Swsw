import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/firebaseConfig';
import { Event, TicketTier } from '../../types/event';
import { getFunctions, httpsCallable } from 'firebase/functions';

const CheckoutScreen = () => {
  const { eventId, selectedTiers: selectedTiersJSON } = useLocalSearchParams();
  const router = useRouter();
  const functions = getFunctions();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !selectedTiersJSON) {
      setLoading(false);
      return;
    }

    const parsedSelectedTiers = JSON.parse(selectedTiersJSON as string);
    setSelectedTiers(parsedSelectedTiers);

    const fetchEventAndTiers = async () => {
      try {
        // Fetch event details
        const eventRef = doc(db, 'events', eventId as string);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
        }

        // Fetch ticket tiers
        const tiersRef = collection(db, 'events', eventId as string, 'ticketTiers');
        const q = query(tiersRef, where('isActive', '==', true), orderBy('sortOrder'));
        const tiersSnap = await getDocs(q);
        const tiers = tiersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketTier));
        setTicketTiers(tiers);

        // Calculate total price
        let total = 0;
        for (const tierId in parsedSelectedTiers) {
          const tier = tiers.find(t => t.id === tierId);
          if (tier) {
            total += tier.price * parsedSelectedTiers[tierId];
          }
        }
        setTotalPrice(total);
      } catch (error) {
        console.error("Error fetching checkout data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndTiers();
  }, [eventId, selectedTiersJSON]);

  const handlePayment = async () => {
    const createStripeCheckout = httpsCallable(functions, 'createStripeCheckout');
    try {
        const lineItems = Object.keys(selectedTiers).map(tierId => {
            const tier = ticketTiers.find(t => t.id === tierId);
            return {
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: `${event?.title} - ${tier?.name}`,
                    },
                    unit_amount: (tier?.price || 0) * 100,
                },
                quantity: selectedTiers[tierId],
            };
        });

        const { data } = await createStripeCheckout({ lineItems });
        const { sessionId } = data as {sessionId: string};
        
        router.push({
            pathname: '/(ticket)/PurchaseConfirmationScreen',
            params: { sessionId: sessionId },
        });

    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        // Handle error, e.g., show a message to the user
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
      <TouchableOpacity style={styles.ctaButton} onPress={handlePayment}>
        <Text style={styles.ctaButtonText}>Pay with Card</Text>
      </TouchableOpacity>
    </View>
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
