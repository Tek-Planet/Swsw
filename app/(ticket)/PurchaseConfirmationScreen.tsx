import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons'; // Using Feather icons for a clean look

const PurchaseConfirmationScreen = () => {
  const { orderId, eventId } = useLocalSearchParams<{ orderId: string, eventId: string }>();
  const router = useRouter();

  const handleViewTicket = () => {
    if (!orderId || !eventId) return;
    router.push({
      pathname: '/(ticket)/TicketScreen',
      params: { orderId, eventId },
    });
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/ExploreScreen'); // Navigate to a main screen, e.g., Explore
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Feather name="check-circle" size={80} color="#4CAF50" />
            </View>

            <Text style={styles.header}>You're In! 🎉</Text>
            
            <Text style={styles.subText}>
                Your tickets have been secured. We've sent a confirmation to your email.
            </Text>

            <View style={styles.orderInfo}>
                <Text style={styles.orderInfoText}>Order ID: {orderId}</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleViewTicket}>
                <Text style={styles.primaryButtonText}>View Ticket Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Text style={styles.secondaryButtonText}>Explore More Events</Text>
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
        fontFamily: 'monospace', // Gives it a ticket-y feel
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
