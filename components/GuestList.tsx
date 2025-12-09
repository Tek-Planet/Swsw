
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export interface Guest {
  id: string;
  avatar: string;
}

interface GuestListProps {
  guests: Guest[];
  total: number;
}

const GuestList: React.FC<GuestListProps> = ({ guests, total }) => {
  const displayedGuests = guests.slice(0, 5); // Show a max of 5 avatars
  const overflowCount = total - displayedGuests.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guest List</Text>
        <Text style={styles.count}>{total} Going</Text>
      </View>
      <View style={styles.avatars}>
        {displayedGuests.map(guest => (
          <Image key={guest.id} source={{ uri: guest.avatar }} style={styles.avatar} />
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
    marginHorizontal: 20,
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
    color: 'gray',
    fontSize: 16,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    marginRight: -16, // Overlap avatars
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

export default GuestList;
