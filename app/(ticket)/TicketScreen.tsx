
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../lib/firebase/firebaseConfig';
import { Event, Order } from '../../types/event';

const TicketScreen = () => {
  const { orderId, eventId } = useLocalSearchParams<{ orderId: string, eventId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !eventId) {
        Alert.alert('Error', 'Missing ticket information.');
        setLoading(false);
        return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
        Alert.alert('Error', 'You must be logged in to view tickets.');
        setLoading(false);
        return;
    }

    const fetchTicketData = async () => {
        try {
            const orderRef = doc(db, 'users', userId, 'orders', orderId);
            const eventRef = doc(db, 'events', eventId);

            const [orderSnap, eventSnap] = await Promise.all([getDoc(orderRef), getDoc(eventRef)]);

            if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                const convertedOrder: Order = {
                    orderId: orderSnap.id,
                    ...orderData,
                    createdAt: (orderData.createdAt as Timestamp).toDate(),
                } as Order;
                setOrder(convertedOrder);
            } else {
                Alert.alert('Error', 'Could not find your order details.');
            }

            if (eventSnap.exists()) {
                const eventData = eventSnap.data();
                const convertedEvent: Event = {
                    id: eventSnap.id,
                    ...eventData,
                    startTime: (eventData.startTime as Timestamp).toDate(),
                } as Event;
                setEvent(convertedEvent);
            } else {
                Alert.alert('Error', 'Could not find event details.');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'There was a problem fetching your ticket.');
        } finally {
            setLoading(false);
        }
    };

    fetchTicketData();
  }, [orderId, eventId]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  if (!order || !event) {
    return <View style={styles.centered}><Text style={styles.errorText}>Could not load ticket.</Text></View>;
  }

  const aggregatedItems = order.items.reduce((acc, item) => {
    const key = `${item.name}-${item.type}`;
    if (!acc[key]) {
      acc[key] = { ...item };
    } else {
      acc[key].quantity += item.quantity;
    }
    return acc;
  }, {} as Record<string, typeof order.items[0]>);

  return (
    <ScrollView style={styles.container}>
       
        <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventHost}>by {event.hostName}</Text>
            </View>

            <View style={styles.ticketBody}>
                <View style={styles.qrContainer}>
                    <View style={styles.qrPlaceholder}>
                        <Ionicons name="qr-code" size={100} color="#fff" />
                    </View>
                    <Text style={styles.scanText}>Show this at the entrance</Text>
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={18} color="#aaa" />
                        <Text style={styles.detailText}>{new Date(event.startTime).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={18} color="#aaa" />
                        <Text style={styles.detailText}>{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={18} color="#aaa" />
                        <Text style={styles.detailText}>{event.location.type === 'online' ? 'Online Event' : event.location.address || 'TBA'}</Text>
                    </View>
                </View>

                <View style={styles.itemsContainer}>
                    <Text style={styles.itemsTitle}>Your Items</Text>
                    {Object.values(aggregatedItems).map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
                            <Text style={styles.itemPrice}>₹{(item.unitPrice * item.quantity).toLocaleString()}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.ticketFooter}>
                 <Text style={styles.orderId}>Order ID: {order.orderId}</Text>
            </View>
        </View>

        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: eventId } })}
            >
                <Ionicons name="eye-outline" size={20} color="#fff" style={{marginRight: 10}}/>
                <Text style={styles.actionButtonText}>View Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton]}
                onPress={() => router.push('/(tabs)')}
            >
                 <Ionicons name="home-outline" size={20} color="#fff" style={{marginRight: 10}}/>
                <Text style={styles.actionButtonText}>Go Home</Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 40,
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 1,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    ticketCard: {
        marginHorizontal: 20,
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 20,
    },
    ticketHeader: {
        backgroundColor: '#6C63FF',
        padding: 25,
        alignItems: 'center',
    },
    eventTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    eventHost: {
        color: '#E0E0E0',
        fontSize: 16,
    },
    ticketBody: {
        padding: 20,
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    qrPlaceholder: {
        width: 150,
        height: 150,
        backgroundColor: '#333',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanText: {
        color: '#aaa',
        marginTop: 10,
    },
    detailsContainer: {
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 10,
    },
    itemsContainer: {},
    itemsTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    itemName: {
        color: '#E0E0E0',
        fontSize: 16,
    },
    itemPrice: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    ticketFooter: {
        backgroundColor: '#333',
        padding: 15,
        alignItems: 'center',
    },
    orderId: {
        color: '#aaa',
        fontSize: 12,
    },
    actionButtonsContainer: {
        padding: 20,
    },
    actionButton: {
        backgroundColor: '#4a90e2',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    secondaryActionButton: {
        backgroundColor: '#333',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TicketScreen;
