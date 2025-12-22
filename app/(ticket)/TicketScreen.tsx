
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
            const orderRef = doc(db, 'orders', orderId);
            const eventRef = doc(db, 'events', eventId);

            const [orderSnap, eventSnap] = await Promise.all([getDoc(orderRef), getDoc(eventRef)]);

            if (orderSnap.exists()) {
                const orderData = orderSnap.data();

                if (orderData.userId !== userId) {
                    Alert.alert('Access Denied', 'You do not have permission to view this ticket.');
                    setOrder(null);
                } else {
                    const convertedOrder: Order = {
                        orderId: orderSnap.id,
                        ...orderData,
                        createdAt: (orderData.createdAt as Timestamp).toDate(),
                        updatedAt: (orderData.updatedAt as Timestamp).toDate(),
                        eventDate: orderData.eventDate ? (orderData.eventDate as Timestamp).toDate() : undefined,
                    } as Order;
                    setOrder(convertedOrder);
                }
            } else {
                Alert.alert('Error', 'Could not find your order details.');
            }

            if (eventSnap.exists()) {
                const eventData = eventSnap.data();
                const convertedEvent: Event = {
                    id: eventSnap.id,
                    ...eventData,
                    startTime: (eventData.startTime as Timestamp).toDate(),
                    endTime: (eventData.endTime as Timestamp).toDate(),
                    latestPhotoAt: eventData.latestPhotoAt ? (eventData.latestPhotoAt as Timestamp).toDate() : undefined,
                  } as Event;
                setEvent(convertedEvent);
            } else {
                Alert.alert('Error', 'Could not find event details.');
            }
        } catch (err) {
            console.error("Error fetching ticket data:", err);
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
                        <Text style={styles.detailText}>{event.startTime.toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={18} color="#aaa" />
                        <Text style={styles.detailText}>{event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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

                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>₹{order.subtotal.toLocaleString()}</Text>
                    </View>

                    {order.processingFee !== undefined && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Processing Fee</Text>
                            <Text style={styles.summaryValue}>₹{order.processingFee.toLocaleString()}</Text>
                        </View>
                    )}

                    {order.total !== undefined && (
                        <>
                            <View style={styles.divider} />
                            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                                <Text style={styles.summaryTotalLabel}>Total</Text>
                                <Text style={styles.summaryTotalValue}>₹{order.total.toLocaleString()}</Text>
                            </View>
                        </>
                    )}
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
    ticketCard: {
        marginHorizontal: 20,
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 20,
        marginBottom: 20,
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
    itemsContainer: {
        paddingBottom: 10,
    },
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
    divider: {
        height: 1,
        backgroundColor: '#444',
        marginVertical: 10,
    },
    summaryContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: '#aaa',
        fontSize: 16,
    },
    summaryValue: {
        color: '#fff',
        fontSize: 16,
    },
    summaryTotalRow: {
        marginTop: 5,
    },
    summaryTotalLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    summaryTotalValue: {
        color: '#fff',
        fontSize: 18,
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
        paddingHorizontal: 20,
        paddingBottom: 20,
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
