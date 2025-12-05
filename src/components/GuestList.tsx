
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface GuestListProps {
  guests: { id: string; avatar: string }[];
  total: number;
}

const GuestList: React.FC<GuestListProps> = ({ guests, total }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guest List</Text>
        <Text style={styles.count}>{total} Going</Text>
      </View>
      <View style={styles.avatars}>
        {guests.map(guest => (
          <Image key={guest.id} source={{ uri: guest.avatar }} style={styles.avatar} />
        ))}
        <View style={styles.overflow}>
          <Text style={styles.overflowText}>+{total - guests.length}</Text>
        </View>
      </View>
      <TouchableOpacity>
        <Text style={styles.viewAll}>View all</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: -10, // overlap avatars
  },
  overflow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  overflowText: {
    color: 'white',
    fontWeight: 'bold',
  },
  viewAll: {
    color: '#6c63ff',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default GuestList;
