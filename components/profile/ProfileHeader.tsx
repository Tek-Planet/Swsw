
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { UserProfile } from '@/types';

interface ProfileHeaderProps {
  userProfile: UserProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: userProfile.photoUrl }} style={styles.image} />
      <Text style={styles.name}>{userProfile.displayName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
});

export default ProfileHeader;
