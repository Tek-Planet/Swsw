
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export interface TicketHolder {
  id: string;
  avatar: string;
  firstName: string;
}

interface TicketHoldersListProps {
  ticketHolders: TicketHolder[];
  total: number;
}

const TicketHoldersList: React.FC<TicketHoldersListProps> = ({ ticketHolders, total }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ticket Holders</Text>
        <Text style={styles.count}>{total} Going</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarsContainer}
      >
        {ticketHolders.map(holder => (
          <View key={holder.id} style={styles.avatarItem}>
            <Image source={{ uri: holder.avatar }} style={styles.avatar} />
            <Text style={styles.guestName} numberOfLines={1}>{holder.firstName}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  count: {
    color: '#A8A8A8',
    fontSize: 14,
    fontWeight: '500',
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 20,
    paddingRight: 10,
  },
  avatarItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 60, 
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 5,
  },
  guestName: {
    color: '#E0E0E0',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default TicketHoldersList;
