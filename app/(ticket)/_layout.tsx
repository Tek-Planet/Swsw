import { Stack } from 'expo-router';
import React from 'react';

export default function TicketLayout() {
  return (
    
    <Stack>
      <Stack.Screen name="TicketSelectionScreen"   options={{  headerShown: false }} />
      <Stack.Screen name="CheckoutScreen" options={{ headerShown:false}} />
      <Stack.Screen name="PurchaseConfirmationScreen" options={{ title: 'Confirmation' }} />
      <Stack.Screen name="PurchaseProcessingScreen" options={{ headerShown:false }} />
    </Stack>
   
  );
}
