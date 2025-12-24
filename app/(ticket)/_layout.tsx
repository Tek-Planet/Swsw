
import { Stack } from 'expo-router';
import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function TicketLayout() {
  // It's best practice to load your key from environment variables.
  // Make sure to set this variable in your project configuration (e.g., .env file).
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!stripePublishableKey) {
    // This log is important for debugging purposes.
    console.error("Stripe publishable key is not set. Payment features will be disabled.");
  }
  
  return (
    // The publishableKey is required for Stripe to work. 
    // A fallback key is used here to prevent the app from crashing during development
    // if the environment variable is not set.
    <StripeProvider 
      publishableKey={stripePublishableKey || "pk_test_YOUR_KEY_HERE"} 
    >
      <Stack>
        <Stack.Screen name="TicketSelectionScreen" options={{ headerShown: false }} />
        <Stack.Screen name="CheckoutScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PurchaseProcessingScreen" options={{ headerShown: false }} />
        <Stack.Screen name="PurchaseConfirmationScreen" options={{ headerShown: false }} />
        <Stack.Screen name="TicketScreen" options={{ headerShown: false }} />
      </Stack>
    </StripeProvider>
  );
}
