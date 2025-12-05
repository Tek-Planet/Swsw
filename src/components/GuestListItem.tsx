
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GuestListItemProps {
  name: string;
  status: string;
}

const GuestListItem: React.FC<GuestListItemProps> = ({ name, status }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  name: {
    color: '#fff',
    fontSize: 16,
  },
  status: {
    color: '#aaa',
    fontSize: 16,
  },
});

export default GuestListItem;
