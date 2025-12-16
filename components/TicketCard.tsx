
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Order } from '../types/event';

interface TicketCardProps {
  order: Order;
}

const TicketCard: React.FC<TicketCardProps> = ({ order }) => {
  const router = useRouter();
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: '/(ticket)/TicketScreen', params: { orderId: order.orderId, eventId: order.eventId } })}
    >
      <View style={styles.cardContent}>
        <Text style={styles.orderId}>Order ID: {order.orderId}</Text>
        <Text style={styles.itemSummary}>{totalItems} item(s)</Text>
        <Text style={styles.totalAmount}>Total: ₹{order.subtotal.toLocaleString()}</Text>
        <Text style={styles.status}>Status: {order.status}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  cardContent: {
    flex: 1,
  },
  orderId: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSummary: {
    color: '#aaa',
    fontSize: 14,
    marginVertical: 5,
  },
  totalAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  status: {
    color: '#4a90e2',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
});

export default TicketCard;
