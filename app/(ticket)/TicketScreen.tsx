import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { auth, db } from '../../lib/firebase/firebaseConfig';
import { Attendee, Event, Order } from '../../types/event';

const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
        case 'INR':
            return '₹';
        case 'USD':
            return '$';
        default:
            return '₹';
    }
};

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
                    convertedOrder.currency = convertedOrder.currency || 'INR';
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
                    currency: eventData.currency || 'INR',
                    bookingFeePercent: eventData.bookingFeePercent || 10,
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
  
  const currencySymbol = getCurrencySymbol(order.currency || event.currency);

  const aggregatedItems = order.items.reduce((acc, item) => {
    const key = `${item.name}-${item.type}`;
    if (!acc[key]) {
      acc[key] = { ...item };
    } else {
      acc[key].quantity += item.quantity;
    }
    return acc;
  }, {} as Record<string, typeof order.items[0]>);

  const allAttendees = [...(order.attendees || [])];
  if (order.tableContactDetails) {
      allAttendees.unshift({ 
          name: order.tableContactDetails.fullName, 
          email: order.tableContactDetails.email,
          phone: order.tableContactDetails.phone
      });
  }

  return (
    <View style={styles.rootContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <ScrollView>
            <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventHost}>by {event.hostName}</Text>
                </View>

                <View style={styles.ticketBody}>
                    <View style={styles.qrContainer}>
                        <View style={styles.qrCodeBackground}>
                            <QRCode
                                value={order.orderId}
                                size={180}
                                backgroundColor='white'
                                color='black'
                            />
                        </View>
                        <Text style={styles.scanText}>Show this at the entrance</Text>
                    </View>

                    <View style={styles.attendeesContainer}>
                        <Text style={styles.attendeesTitle}>Ticket Holders</Text>
                        {allAttendees.map((attendee: Attendee, index: number) => (
                            <View key={index} style={styles.attendeeRow}>
                                <Ionicons name="person-outline" size={20} color="#A8A8A8" style={{marginRight: 10}}/>
                                <View>
                                    <Text style={styles.attendeeName}>{attendee.name}</Text>
                                    <Text style={styles.attendeeEmail}>{attendee.email}</Text>
                                    {attendee.phone && (
                                        <View style={styles.attendeePhoneRow}>
                                            <Ionicons name="call-outline" size={16} color="#A8A8A8" style={{marginRight: 5}}/>
                                            <Text style={styles.attendeePhone}>{attendee.phone}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.itemsContainer}>
                        <Text style={styles.itemsTitle}>Your Items</Text>
                        {Object.values(aggregatedItems).map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
                                <Text style={styles.itemPrice}>{currencySymbol}{(item.unitPrice * item.quantity).toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>{currencySymbol}{order.subtotal.toLocaleString()}</Text>
                        </View>

                        {order.processingFee > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Processing Fee</Text>
                                <Text style={styles.summaryValue}>{currencySymbol}{order.processingFee.toLocaleString()}</Text>
                            </View>
                        )}

                        {order.gstAmount > 0 && (
                            <View style={styles.summaryRow}>
                                 <Text style={styles.summaryLabel}>GST ({order.gstPercent}%)</Text>
                                 <Text style={styles.summaryValue}>{currencySymbol}{order.gstAmount.toLocaleString()}</Text>
                            </View>
                        )}

                        {order.discount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, styles.discountText]}>Discount</Text>
                                <Text style={[styles.summaryValue, styles.discountText]}>-{currencySymbol}{order.discount.toLocaleString()}</Text>
                            </View>
                        )}

                        <View style={styles.divider} />
                        <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                            <Text style={styles.summaryTotalLabel}>Total Paid</Text>
                            <Text style={styles.summaryTotalValue}>{currencySymbol}{order.total.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.ticketFooter}>
                     <Text style={styles.orderId}>Order ID: {order.orderId.toUpperCase()}</Text>
                </View>
            </View>
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    rootContainer: {
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
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginBottom: 30,
    },
    qrCodeBackground: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
    },
    scanText: {
        color: '#aaa',
        marginTop: 15,
        fontSize: 14,
    },
    attendeesContainer: {
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 20
    },
    attendeesTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    attendeeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    attendeeName: {
        color: '#E0E0E0',
        fontSize: 16,
        fontWeight: 'bold'
    },
    attendeeEmail: {
        color: '#A8A8A8',
        fontSize: 14,
    },
    attendeePhoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    attendeePhone: {
        color: '#A8A8A8',
        fontSize: 14,
        marginLeft: 5,
    },
    itemsContainer: {
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 10
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
    discountText: {
        color: '#4CAF50',
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
        fontFamily: 'monospace', 
    }
});

export default TicketScreen;
