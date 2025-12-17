
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FloatingRSVPBarProps {
  eventId: string;
  hasTicket: boolean;
}

const FloatingRSVPBar: React.FC<FloatingRSVPBarProps> = ({ eventId, hasTicket }) => {
  const router = useRouter();

  if (hasTicket) {
    return (
      <View style={styles.container_going}>
        <View style={styles.leftContent}>
          <Text style={styles.status}>🎉 Going</Text>
        </View>
        <View style={styles.rightContent}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push({ pathname: '/(ticket)/TicketSelectionScreen', params: { eventId } })}>
            <Ionicons name="add-circle-outline" size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push({ pathname: '/event/tickets', params: { eventId } })}>
            <Ionicons name="ticket-outline" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container_buy}>
        <TouchableOpacity style={styles.buyButton} onPress={() => router.push(`/(ticket)/TicketSelectionScreen?eventId=${eventId}`)}>
          <Text style={styles.buyButtonText}>Buy Tickets</Text>
        </TouchableOpacity>
    </View>
  );

};

const styles = StyleSheet.create({
  container_going: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6c63ff',
    borderRadius: 30,
  },
  container_buy: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'transparent',
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconButton: {
    marginLeft: 15,
  },
  buyButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FloatingRSVPBar;
