
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../lib/firebase/firebaseConfig'; // Assuming you have a firebaseConfig file
import { Event, TicketTier } from '../../types/event';
import TopNavBar from '../../components/TopNavBar';
import { ThemedView } from '../../components/themed-view';

const TicketSelectionScreen = () => {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<{ [key: string]: number }>({});
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventDetails = async () => {
      const eventRef = doc(db, 'events', eventId as string);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
      }
    };

    const fetchTicketTiers = async () => {
      const tiersRef = collection(db, 'events', eventId as string, 'ticketTiers');
      const q = query(tiersRef, where('isActive', '==', true), orderBy('sortOrder'));
      const tiersSnap = await getDocs(q);
      const tiers = tiersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketTier));
      setTicketTiers(tiers);
    };

    fetchEventDetails();
    fetchTicketTiers();
  }, [eventId]);

  const handleQuantityChange = (tierId: string, quantity: number) => {
    const newSelectedTiers = { ...selectedTiers, [tierId]: quantity };
    if (quantity === 0) {
      delete newSelectedTiers[tierId];
    }
    setSelectedTiers(newSelectedTiers);
  };

  useEffect(() => {
    let total = 0;
    for (const tierId in selectedTiers) {
      const tier = ticketTiers.find(t => t.id === tierId);
      if (tier) {
        total += tier.price * selectedTiers[tierId];
      }
    }
    setTotalPrice(total);
  }, [selectedTiers, ticketTiers]);

  const renderTier = ({ item }: { item: TicketTier }) => {
    const maxQuantity = item.type === 'table' ? 1 : 10;
    const currentQuantity = selectedTiers[item.id] || 0;

    return (
      <View style={styles.tierCard}>
      <View style={styles.tierInfo}>
          <Text style={styles.tierName}>{item.name}</Text>
          <Text style={styles.tierPrice}>₹{item.price.toLocaleString()}</Text>
          {item.description && <Text style={styles.tierDescription}>{item.description}</Text>}
        </View>
        <View style={styles.quantitySelector}>
          <TouchableOpacity onPress={() => handleQuantityChange(item.id, currentQuantity - 1)} disabled={currentQuantity === 0}>
            <Text style={[styles.quantityButton, currentQuantity === 0 && styles.disabledQuantityButton]}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{currentQuantity}</Text>
          <TouchableOpacity onPress={() => handleQuantityChange(item.id, currentQuantity + 1)} disabled={currentQuantity >= maxQuantity}>
            <Text style={[styles.quantityButton, currentQuantity >= maxQuantity && styles.disabledQuantityButton]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleContinueToPay = () => {
    router.push({
      pathname: '/(ticket)/CheckoutScreen',
      params: { eventId: eventId as string, selectedTiers: JSON.stringify(selectedTiers) },
    });
  };

  const isContinueDisabled = Object.keys(selectedTiers).length === 0;

  if (!event) {
    return <ThemedView style={styles.container}><Text style={styles.text}>Loading...</Text></ThemedView>;
  }

  return (
    <ThemedView style={styles.container} darkColor="#000">
        <TopNavBar title={event.title} onBackPress={() => router.back()} />

      <FlatList
        data={ticketTiers}
        renderItem={renderTier}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.stickyFooter}>
        <Text style={styles.totalPrice}>Total: ₹{totalPrice.toLocaleString()}</Text>
        <TouchableOpacity 
          style={[styles.ctaButton, isContinueDisabled && styles.ctaButtonDisabled]}
          onPress={handleContinueToPay}
          disabled={isContinueDisabled}
        >
          <Text style={styles.ctaButtonText}>Continue to Pay</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    marginTop: 150,
  },
  listContainer: {
    paddingTop: 100, // To account for the absolute positioned TopNavBar
    paddingBottom: 120, // To avoid being hidden by the footer
  },
  tierCard: {
   
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tierPrice: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 5,
  },
  tierDescription: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  tierInfo: { flex: 1, // take available space 
    marginRight: 10, // add spacing before buttons 
    },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    color: '#4a90e2',
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  disabledQuantityButton: {
    color: '#555',
  },
  quantityText: {
    color: '#fff',
    fontSize: 18,
    marginHorizontal: 10,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ctaButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  ctaButtonDisabled: {
    backgroundColor: '#888',
    opacity: 0.7,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TicketSelectionScreen;
