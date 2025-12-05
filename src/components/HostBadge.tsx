
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface HostBadgeProps {
  avatar: string;
  name: string;
  onFollow: () => void;
}

const HostBadge: React.FC<HostBadgeProps> = ({ avatar, name, onFollow }) => {
  return (
    <View style={styles.badge}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <Text style={styles.name}>{name}</Text>
      <TouchableOpacity onPress={onFollow} style={styles.followButton}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 25,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  followButton: {
    backgroundColor: '#6c63ff',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HostBadge;
