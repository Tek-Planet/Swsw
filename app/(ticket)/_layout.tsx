import React from 'react';
import { Stack } from 'expo-router';

export default function TicketLayout() {
  return (
    <Stack>
      <Stack.Screen name="TicketSelectionScreen" options={{ title: 'Select Tickets' }} />
      <Stack.Screen name="CheckoutScreen" options={{ title: 'Checkout' }} />
      <Stack.Screen name="PurchaseConfirmationScreen" options={{ title: 'Confirmation' }} />
    </Stack>
  );
}
