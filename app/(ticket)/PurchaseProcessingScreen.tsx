
import TopNavBar from '@/components/TopNavBar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../lib/firebase/firebaseConfig';
import { Order } from '../../types/event';

const PurchaseProcessingScreen = () => {
    const { orderId, eventId } = useLocalSearchParams<{ orderId: string, eventId: string }>();
    const router = useRouter();
    const [status, setStatus] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!orderId || !eventId) {
            Alert.alert("Error", "Missing order or event information.", [{ text: "OK", onPress: () => router.back() }]);
            return;
        }

        const userId = auth.currentUser?.uid;
        if (!userId) {
            Alert.alert("Error", "You must be logged in to view a purchase.", [{ text: "OK", onPress: () => router.replace('/(auth)/signIn') }]);
            return;
        }

        // Correct reference to the top-level 'orders' collection
        const orderRef = doc(db, 'orders', orderId);

        // Initial check to see if the order is already paid (for free/VIP orders)
        // or to determine if we need to show the waiting UI.
        getDoc(orderRef).then(docSnap => {
            if (docSnap.exists()) {
                const orderData = docSnap.data();
                if (orderData.userId !== userId) {
                     Alert.alert("Access Denied", "This order does not belong to you.", [{ text: "OK", onPress: () => router.replace(`/event/${eventId}`) }]);
                     return;
                }
                if (orderData.status === 'paid') {
                    router.replace({
                        pathname: '/(ticket)/PurchaseConfirmationScreen',
                        params: { orderId: docSnap.id, eventId: orderData.eventId },
                    });
                } else {
                    setStatus(orderData.status); // e.g., 'pending'
                    setIsChecking(false); // Show the waiting UI
                }
            } else {
                // This can happen if the user navigates here but cancels on the Stripe page
                // or if the order was already cancelled.
                setIsChecking(false); // Stop loading
                setStatus('cancelled'); // Set a status to reflect this
            }
        }).catch(err => {
            console.error("Error fetching initial order status:", err);
            setIsChecking(false);
            Alert.alert("Error", "Could not check your order status.", [{ text: "OK", onPress: () => router.back() }]);
        });

        // Set up the real-time listener for status changes (e.g., from Stripe webhook)
        const unsubscribe = onSnapshot(orderRef, (docSnap) => {
            if (docSnap.exists()) {
                const order = docSnap.data() as Order;
                if (order.status === 'paid') {
                    unsubscribe();
                    router.replace({
                        pathname: '/(ticket)/PurchaseConfirmationScreen',
                        params: { orderId: order.orderId, eventId: order.eventId },
                    });
                }
            } else {
                // Order was deleted/cancelled
                unsubscribe();
                setStatus('cancelled');
            }
        });

        return () => unsubscribe();
    }, [orderId, eventId]);

    const handleCancelOrder = async () => {
        Alert.alert(
            "Cancel Order",
            "Are you sure you want to cancel this pending order? This action cannot be undone.",
            [
                { text: "Don't Cancel", style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        if (!orderId) return;
                        try {
                            // Correctly delete the single order document from the top-level collection
                            await deleteDoc(doc(db, 'orders', orderId));
                            // The onSnapshot listener will then catch the deletion and update the UI state
                            router.replace({ pathname: '/event/[id]', params: { id: eventId } });
                        } catch (error) {
                            console.error("Error cancelling order:", error);
                            Alert.alert("Error", "Could not cancel the order. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    const handleTryAgain = () => {
        router.back(); // Go back to CheckoutScreen to try payment again
    };

    const handleBackToEvent = () => {
        router.replace({ pathname: '/event/[id]', params: { id: eventId }});
    };

    // Initial loading state while we fetch the order for the first time
    if (isChecking) {
        return (
            <View style={styles.container}>
                <TopNavBar title="Processing Order" onBackPress={() => router.back()} />
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color="#4a90e2" />
                    <Text style={styles.header}>Verifying your order...</Text>
                </View>
            </View>
        );
    }
    
    // UI for when the order has been cancelled or not found
    if (status === 'cancelled') {
        return (
             <View style={styles.container}>
                <TopNavBar title="Order Not Found" onBackPress={handleBackToEvent} />
                <View style={styles.centeredContent}>
                    <Text style={styles.header}>Order Not Found</Text>
                    <Text style={styles.subText}>
                        This order may have been cancelled or could not be found.
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={handleBackToEvent}>
                        <Text style={styles.buttonText}>Back to Event</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // UI for when we are waiting for payment confirmation
    return (
        <View style={styles.container}>
             <TopNavBar title="Waiting for Payment" onBackPress={handleBackToEvent} />
             <View style={styles.centeredContent}>
                <ActivityIndicator size="large" color="#4a90e2" />
                <Text style={styles.header}>Waiting for Payment</Text>
                <Text style={styles.subText}>
                    This screen will update automatically once payment is confirmed.
                </Text>

                <View style={styles.buttonContainer}>
                    <Text style={styles.actionsHeader}>Changed your mind?</Text>
                     <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelOrder}>
                        <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleBackToEvent}>
                        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Back to Event</Text>
                    </TouchableOpacity>
                </View>
             </View>
        </View>
    );
};

// Re-using and slightly modifying styles for better centering and clarity
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 10,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    header: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center',
    },
    subText: {
        color: '#aaa',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    buttonContainer: {
        marginTop: 30,
        width: '100%',
        alignItems: 'center',
    },
    actionsHeader: {
        color: '#aaa',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#4a90e2',
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 20,
        width: '80%',
        alignItems: 'center',
        marginBottom: 15,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#4a90e2',
    },
    cancelButton: {
        backgroundColor: '#d9534f',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#4a90e2',
    },
    cancelButtonText: {
        color: '#fff',
    },
});

export default PurchaseProcessingScreen;
