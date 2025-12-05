import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import CTAButton from './CTAButton';

interface ProfileMiniCardProps {
  user: {
    avatar: string;
    name: string;
    descriptor: string;
  };
}

const ProfileMiniCard: React.FC<ProfileMiniCardProps> = ({ user }) => (
  <View style={styles.card}>
    <Image source={{ uri: user.avatar }} style={styles.avatar} />
    <Text style={styles.name}>{user.name}</Text>
    <Text style={styles.descriptor}>{user.descriptor}</Text>
    <CTAButton title="Say Hi" onPress={() => {}} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    margin: 10,
    width: 150,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 10,
  },
  descriptor: {
    color: '#aaa',
    fontSize: 12,
    marginVertical: 5,
  },
});

export default ProfileMiniCard;
