
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FloatingRSVPBarProps {
  eventId: string;
}

const FloatingRSVPBar: React.FC<FloatingRSVPBarProps> = ({ eventId }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
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
};

const styles = StyleSheet.create({
  container: {
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
});

export default FloatingRSVPBar;
