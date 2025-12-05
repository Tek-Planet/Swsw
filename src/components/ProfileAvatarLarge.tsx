
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface ProfileAvatarLargeProps {
  source: string;
}

const ProfileAvatarLarge: React.FC<ProfileAvatarLargeProps> = ({ source }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: source }} style={styles.avatar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6c63ff',
  },
});

export default ProfileAvatarLarge;
