
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

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
 
  const displayedTicketHolders = ticketHolders.slice(0, 5); // Show a max of 5 avatars
  const overflowCount = total - displayedTicketHolders.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ticket Holders</Text>
        <Text style={styles.count}>{total} Going</Text>
      </View>
      <View style={styles.avatars}>
        {displayedTicketHolders.map(holder => (
          <View key={holder.id} style={styles.avatarContainer}>
            <Image source={{ uri: holder.avatar }} style={styles.avatar} />
            <Text style={styles.guestName}>{holder.firstName}</Text>
          </View>
        ))}
        {overflowCount > 0 && (
          <View style={styles.overflow}>
            <Text style={styles.overflowText}>+{overflowCount}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity>
        <Text style={styles.viewAll}>View all</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  avatars: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: 10, 
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
  overflow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    marginLeft: 16,
  },
  overflowText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  viewAll: {
    color: '#A855F7', // A vibrant purple
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TicketHoldersList;
