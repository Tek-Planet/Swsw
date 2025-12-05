
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useAuth } from '@/lib/context/AuthContext';

const ProfileHeader = () => {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Image source={{ uri: user?.photoUrl }} style={styles.image} />
      <Text style={styles.name}>{user?.username}</Text>
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
