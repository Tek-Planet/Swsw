
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet } from 'react-native';
import TicketCard from '../../components/TicketCard';
import TopNavBar from '../../components/TopNavBar';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { auth, db } from '../../lib/firebase/firebaseConfig';
import { Order } from '../../types/event';

const EventTicketsScreen = () => {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;
  const router = useRouter();

  useEffect(() => {
    if (!userId || !eventId) {
      Alert.alert('Error', 'User or event information is missing.');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('eventId', '==', eventId), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({ orderId: doc.id, ...doc.data() } as Order));
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        Alert.alert('Error', 'Could not fetch your tickets for this event.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId, eventId]);

  if (loading) {
    return (
        <ThemedView style={styles.centered}>
            <ActivityIndicator size="large" color="#fff" />
        </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <TopNavBar title="Your Tickets" onBackPress={() => router.back()} />
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={item => item.orderId}
          renderItem={({ item }) => <TicketCard order={item} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <ThemedText style={styles.noTicketsText}>You have no tickets for this event.</ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  listContent: {
    paddingTop: 10, 
  },
  noTicketsText: {
    textAlign: 'center',
    marginTop: 150,
    fontSize: 16,
  },
});

export default EventTicketsScreen;
