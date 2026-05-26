
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';

import { useEvent } from '@/hooks/useEvent'; 
import { useVenue } from '@/hooks/useVenue';
import { holdMovieSeats } from '@/lib/services/movieService';
import { createOrder } from '@/lib/services/eventService'; // We will need a new function for movie orders
import { useAuth } from '@/lib/context/AuthContext';
import { theme } from '@/constants/theme';
import OrderSummaryCard from '@/components/OrderSummaryCard'; // Assuming a generic summary card

const CheckoutScreen = () => {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Get order details from params
  const orderType = params.orderType as 'movie' | 'regular';
  const seatsQuery = params.seats as string;

  const [isProcessing, setIsProcessing] = useState(false);

  const { event, loading: eventLoading } = useEvent(eventId);
  const { venue, loading: venueLoading } = useVenue(event?.venueId);

  const selectedSeats = useMemo(() => seatsQuery?.split(',') || [], [seatsQuery]);

  const { subtotal, fee, total } = useMemo(() => {
    if (orderType !== 'movie' || !venue) {
      return { subtotal: 0, fee: 0, total: 0 };
    }
    const newSubtotal = selectedSeats.reduce((acc, seatId) => {
      const [rowLabel] = seatId.split('-');
      const row = venue.rows.find(r => r.label === rowLabel);
      return acc + (row?.price || 0);
    }, 0);

    const feePercent = event?.bookingFeePercent ?? 0;
    const newFee = newSubtotal * (feePercent / 100);
    const newTotal = newSubtotal + newFee;

    return { subtotal: newSubtotal, fee: newFee, total: newTotal };
  }, [selectedSeats, venue, event, orderType]);

  const handlePayment = async () => {
    if (!user || !eventId || !event) {
        Alert.alert('Error', 'You must be logged in to complete this purchase.');
        return;
    }

    setIsProcessing(true);

    try {
        // 1. Hold Seats
        await holdMovieSeats(eventId, selectedSeats);

        // 2. Create a preliminary order to get a payment intent from the backend
        const orderPayload = {
            orderType: 'movie',
            eventId,
            items: selectedSeats.map(id => ({ seatId: id })), // Adjust based on backend expectation
            total,
            currency: venue?.currency,
        };
        // This function will need to be created/adjusted in your eventService
        const { clientSecret, orderId } = await createOrder(orderPayload);

        // 3. Initialize Payment Sheet
        const { error: initError } = await initPaymentSheet({
            merchantDisplayName: 'Gridpoint',
            paymentIntentClientSecret: clientSecret,
        });

        if (initError) {
            Alert.alert('Error', `Payment sheet failed to initialize: ${initError.message}`);
            setIsProcessing(false);
            return;
        }

        // 4. Present Payment Sheet
        const { error: paymentError } = await presentPaymentSheet();

        if (paymentError) {
            if (paymentError.code !== 'Canceled') {
                 Alert.alert('Payment failed', paymentError.message);
            }
            // TODO: Call a function to release the held seats
        } else {
            Alert.alert('Success', 'Your order is confirmed!');
            router.push(`/orders/${orderId}`); // Navigate to order confirmation
        }
    } catch (e: any) {
        Alert.alert('Error', e.message || 'An unexpected error occurred.');
    } finally {
        setIsProcessing(false);
    }
  };

  const isLoading = eventLoading || venueLoading;

  if (isLoading) {
    return <ActivityIndicator style={styles.center} size="large" color={theme.colors.primary} />;
  }

  if (!event || !venue) {
    return <Text style={styles.errorText}>Could not load event details.</Text>;
  }

  return (
    <View style={styles.container}>
        <Text style={styles.header}>Confirm Your Order</Text>
        
        <OrderSummaryCard 
            eventTitle={event.title}
            subtotal={subtotal}
            fee={fee}
            total={total}
            currency={venue.currency}
        />

        {/* Add more details like seat numbers if you want */}

        <TouchableOpacity 
            style={[styles.payButton, isProcessing && styles.disabledButton]}
            onPress={handlePayment}
            disabled={isProcessing}
        >
            {isProcessing ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.payButtonText}>Proceed to Pay</Text>
            )}
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
    },
    errorText: {
        color: theme.colors.error,
        textAlign: 'center',
        marginTop: 50,
    },
    payButton: {
        backgroundColor: theme.colors.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: theme.colors.disabled,
    }
});

export default CheckoutScreen;
