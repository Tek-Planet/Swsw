
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface HostInfoProps {
  host: {
    name: string;
    photoUrl?: string;
  }
}

const HostInfo: React.FC<HostInfoProps> = ({ host }) => {
  return (
    <View style={styles.hostContainer}>
      <Image 
        source={{ uri: host.photoUrl || 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} 
        style={styles.hostAvatar} 
      />
      <View style={styles.hostTextContainer}>
        <Text style={styles.hostName}>{host.name}</Text>
        <Text style={styles.hostLabel}>Host</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    margin: 20,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  hostTextContainer: {
    flex: 1,
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hostLabel: {
    color: '#A8A8A8',
    fontSize: 14,
  },
});

export default HostInfo;
