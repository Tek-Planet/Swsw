
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '../../components/themed-view';
import { auth, db } from '../../lib/firebase/firebaseConfig';
import { Order } from '../../types/event';

const PurchaseConfirmationScreen = () => {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert("Not Authenticated", "You must be logged in to view a confirmation.");
      router.replace('/(auth)/signIn');
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      const orderRef = doc(db, 'orders', orderId);
      try {
        const docSnap = await getDoc(orderRef);
        if (docSnap.exists()) {
          const orderData = docSnap.data() as Order;
          if (orderData.userId !== userId) {
            setError("You do not have permission to view this order.");
          } else {
            setOrder(orderData);
          }
        } else {
          setError("This order could not be found.");
        }
      } catch (e) {
        console.error("Error fetching confirmation:", e);
        setError("An error occurred while fetching your order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleViewTicket = () => {
    if (!order) return;
    router.push({
      pathname: '/(ticket)/TicketScreen',
      params: { orderId: order.orderId },
    });
  };

  const handleBackToEvent = () => {
      if (!order) {
          router.replace('/');
          return;
      };
      // Correctly typed path for Expo Router
      router.replace({ pathname: '/event/[id]', params: { id: order.eventId } });
  };

  if (loading) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Confirmation...</Text>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <Feather name="alert-circle" size={60} color="#d9534f" />
        <Text style={styles.header}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Feather name="check-circle" size={80} color="#4CAF50" />
            </View>

            <Text style={styles.header}>You're In! 🎉</Text>
            
            <Text style={styles.subText}>
                Your tickets for <Text style={{fontWeight: 'bold'}}>{order?.eventTitle || 'the event'}</Text> have been secured.
            </Text>

            <View style={styles.orderInfo}>
                <Text style={styles.orderInfoText}>Order ID: {orderId}</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleViewTicket}>
                <Text style={styles.primaryButtonText}>View My Tickets</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToEvent}>
                <Text style={styles.secondaryButtonText}>Back to Event</Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        padding: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
        padding: 20,
    },
    loadingText: {
        marginTop: 15,
        color: '#aaa',
        fontSize: 16,
    },
    errorText: {
        color: '#aaa',
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 15,
        lineHeight: 24,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 25,
    },
    header: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    subText: {
        color: '#B0B0B0',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    orderInfo: {
        backgroundColor: '#2A2A2A',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    orderInfoText: {
        color: '#E0E0E0',
        fontSize: 14,
        fontFamily: 'monospace',
    },
    primaryButton: {
        backgroundColor: '#4a90e2',
        borderRadius: 10,
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 10,
    },
    secondaryButtonText: {
        color: '#4a90e2',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default PurchaseConfirmationScreen;
