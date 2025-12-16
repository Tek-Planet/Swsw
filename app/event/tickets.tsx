
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase/firebaseConfig';
import { Order } from '../../types/event';
import TicketCard from '../../components/TicketCard';

const EventTicketsScreen = () => {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId || !eventId) {
      Alert.alert('Error', 'User or event information is missing.');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const ordersRef = collection(db, 'users', userId, 'orders');
        const q = query(ordersRef, where('eventId', '==', eventId));
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
    return <ActivityIndicator style={styles.centered} size="large" color="#fff" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Tickets for this Event</Text>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={item => item.orderId}
          renderItem={({ item }) => <TicketCard order={item} />}
        />
      ) : (
        <Text style={styles.noTicketsText}>You have no tickets for this event.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  noTicketsText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});

export default EventTicketsScreen;
