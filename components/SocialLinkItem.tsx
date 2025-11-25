
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {Ionicons } from '@react-native-vector-icons/ionicons';

interface SocialLinkItemProps {
  platform: string;
  username?: string;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const SocialLinkItem: React.FC<SocialLinkItemProps> = ({ platform, username, isConnected, onConnect, onDisconnect }) => {
  return (
    <View style={styles.container}>
      <Ionicons name={`logo-${platform.toLowerCase()}`} size={30} color="#fff" />
      <View style={styles.info}>
        <Text style={styles.platform}>{platform}</Text>
        {isConnected && <Text style={styles.username}>{username}</Text>}
      </View>
      <TouchableOpacity onPress={isConnected ? onDisconnect : onConnect}>
        <Text style={styles.buttonText}>{isConnected ? 'Disconnect' : 'Connect'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#333',
    borderRadius: 10,
    marginVertical: 5,
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  platform: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    color: '#aaa',
    fontSize: 14,
  },
  buttonText: {
    color: '#6c63ff',
    fontSize: 16,
  },
});

export default SocialLinkItem;
