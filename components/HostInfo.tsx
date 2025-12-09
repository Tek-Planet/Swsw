
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';

interface HostInfoProps {
  host: {
    name: string;
    photoURL?: string;
    photoUrl?: string; // Handling inconsistent casing
  };
}

const HostInfo: React.FC<HostInfoProps> = ({ host }) => {
  // Use the photoURL, fallback to photoUrl, then to a default placeholder
  const hostAvatar = host.photoURL || host.photoUrl || 'https://via.placeholder.com/150';

  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>Hosted by</Text>
        <TouchableOpacity>
          <Icon name="chevron-forward" size={24} color="#A855F7" />
        </TouchableOpacity>
      </View>
      <View style={styles.hostContainer}>
        <Image source={{ uri: hostAvatar }} style={styles.avatar} />
        <Text style={styles.hostName}>{host.name}</Text>
      </View>
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
  cardHeader: {
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
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 15,
  },
  hostName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HostInfo;
