import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase/firebaseConfig';
import { Order, Event } from '../../types/event';
import { BarCodeScanner } from 'expo-barcode-scanner'; // Using as a stand-in for QR code generation

const TicketScreen = () => {
  const { orderId, eventId } = useLocalSearchParams<{ orderId: string, eventId: string }>();
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
                setOrder({ orderId: orderSnap.id, ...orderSnap.data() } as Order);
            } else {
                Alert.alert('Error', 'Could not find your order details.');
            }

            if (eventSnap.exists()) {
                setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
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

  // Combine items by name and type to handle multiple quantities of the same item
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
        <View style={styles.ticketContainer}>
            <View style={styles.header}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventHost}>by {event.hostName}</Text>
            </View>

            <View style={styles.detailsSection}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>{new Date(event.startTime).toLocaleString()}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{event.location.type === 'online' ? 'Online Event' : event.location.address}</Text>
                </View>
            </View>

            <View style={styles.qrSection}>
                {/* This is a placeholder for a real QR code. We generate a fake one based on orderId */}
                <BarCodeScanner
                    type={"qr"}
                    style={{ height: 150, width: 150 }}
                    value={order.orderId}
                />
                <Text style={styles.scanText}>Show this QR code at the event</Text>
            </View>

            <View style={styles.itemsSection}>
                <Text style={styles.itemsHeader}>Your Items</Text>
                {Object.values(aggregatedItems).map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.quantity} x {item.name}</Text>
                        <Text style={styles.itemPrice}>₹{(item.unitPrice * item.quantity).toLocaleString()}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.footer}>
                 <Text style={styles.orderId}>Order ID: {order.orderId}</Text>
                 <Text style={styles.purchaseDate}>Purchased on: {new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
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
    ticketContainer: {
        margin: 20,
        backgroundColor: '#2c2c2c',
        borderRadius: 15,
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#4a90e2',
        padding: 20,
    },
    eventTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 'bold',
    },
    eventHost: {
        color: '#f0f0f0',
        fontSize: 16,
        marginTop: 4,
    },
    detailsSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    detailItem: {
        marginBottom: 15,
    },
    detailLabel: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 4,
    },
    detailValue: {
        color: '#fff',
        fontSize: 16,
    },
    qrSection: {
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    scanText: {
        color: '#aaa',
        marginTop: 10,
        fontSize: 14,
    },
    itemsSection: {
        padding: 20,
    },
    itemsHeader: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    itemName: {
        color: '#f0f0f0',
        fontSize: 16,
    },
    itemPrice: {
        color: '#f0f0f0',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        backgroundColor: '#1a1a1a',
        padding: 15,
        alignItems: 'center',
    },
    orderId: {
        color: '#888',
        fontSize: 12,
    },
    purchaseDate: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
    },
});

export default TicketScreen;
