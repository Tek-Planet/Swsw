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
    const [showFullUI, setShowFullUI] = useState(false);

    useEffect(() => {
        if (!orderId || !eventId) {
            Alert.alert("Error", "Missing order or event information.", [{ text: "OK", onPress: () => router.back() }]);
            return;
        }

        const userId = auth.currentUser?.uid;
        if (!userId) {
            Alert.alert("Error", "You must be logged in to manage a purchase.", [{ text: "OK", onPress: () => router.replace('/(auth)/signIn') }]);
            return;
        }

        const userOrderRef = doc(db, 'users', userId, 'orders', orderId);

        // Immediately check the order status before setting up the listener.
        getDoc(userOrderRef).then(docSnap => {
            if (docSnap.exists() && docSnap.data().status === 'paid') {
                // If already paid (e.g., free/VIP order), redirect immediately.
                router.replace({
                    pathname: '/(ticket)/PurchaseConfirmationScreen',
                    params: { orderId: docSnap.id, eventId: docSnap.data().eventId },
                });
            } else {
                // Otherwise, it's a pending Stripe order. Show the UI and listen for updates.
                setShowFullUI(true);
            }
        });

        const unsubscribe = onSnapshot(userOrderRef, (docSnap) => {
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
                // Order was likely cancelled or doesn't exist
                Alert.alert("Error", "This order could not be found.", [{ text: "OK", onPress: () => router.replace({ pathname: '/event/[id]', params: { id: eventId }}) }]);
                unsubscribe();
            }
        });

        return () => unsubscribe();
    }, [orderId, eventId]);

    const handleCancelOrder = async () => {
        Alert.alert(
            "Cancel Order",
            "Are you sure you want to cancel this order? This action cannot be undone.",
            [
                { text: "Don't Cancel", style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        const userId = auth.currentUser?.uid;
                        if (!orderId || !eventId || !userId) return;

                        const userOrderRef = doc(db, 'users', userId, 'orders', orderId);
                        const eventOrderRef = doc(db, 'events', eventId, 'orders', orderId);

                        try {
                            // Deleting the order from both the user's and event's collections
                            await deleteDoc(userOrderRef);
                            await deleteDoc(eventOrderRef);
                            router.back();
                        } catch (error) {
                            console.error("Error deleting order:", error);
                            Alert.alert("Error", "Could not delete the order. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    const handleTryAgain = () => {
        router.back(); // Go back to CheckoutScreen
    };

    const handleDecideLater = () => {
        router.replace({ pathname: '/event/[id]', params: { id: eventId }}); // Go to event details
    };

    // Render a simple loading indicator until the initial check is complete.
    if (!showFullUI) {
        return (
            <View style={styles.container}>
            <TopNavBar title="Order Summary" onBackPress={() => router.back()} />
<View style={{marginTop:50}}>
<ActivityIndicator size="large" color="#4a90e2" />
                <Text style={styles.header}>Processing your order...</Text>
</View>
            </View>
        );
    }

    // If the order isn't paid yet, show the full UI with cancellation options.
    return (
        <View style={styles.container}>
             <TopNavBar title="Order Summary" onBackPress={() => router.back()} />
            <ActivityIndicator size="large" color="#4a90e2" />
            <Text style={styles.header}>Waiting for Payment</Text>
            <Text style={styles.subText}>
                We're waiting for confirmation from the payment provider. This screen will update automatically once the payment is complete.
            </Text>

            <View style={styles.buttonContainer}>
                <Text style={styles.actionsHeader}>Took too long or changed your mind?</Text>
                <TouchableOpacity style={styles.button} onPress={handleTryAgain}>
                    <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelOrder}>
                    <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel Order</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleDecideLater}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Decide Later</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 10,
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
        width: '100%',
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
