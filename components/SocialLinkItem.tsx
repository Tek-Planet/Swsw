
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SocialLinkItemProps {
  platform: string;
  username?: string;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const SocialLinkItem: React.FC<SocialLinkItemProps> = ({ platform, username, isConnected, onConnect, onDisconnect }) => {
  let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'link';

  switch (platform.toLowerCase()) {
    case 'facebook':
      iconName = 'logo-facebook';
      break;
    case 'twitter':
      iconName = 'logo-twitter';
      break;
    case 'instagram':
      iconName = 'logo-instagram';
      break;
    case 'linkedin':
      iconName = 'logo-linkedin';
      break;
  }

  return (
    <View style={styles.container}>
      <Ionicons name={iconName} size={30} color="#fff" />
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
