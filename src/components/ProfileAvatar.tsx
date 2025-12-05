
import React from 'react';
import { Image, StyleSheet,  } from 'react-native';

interface ProfileAvatarProps {
  source: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ source }) => {
  return <Image source={{ uri: source }} style={styles.avatar} />;
};

export const ProfileAvatarLarge: React.FC<ProfileAvatarProps> = ({ source }) => {
  return <Image source={{ uri: source }} style={styles.avatarLarge} />;
};

const styles = StyleSheet.create({
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarLarge: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
});
