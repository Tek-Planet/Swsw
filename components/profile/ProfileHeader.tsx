
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProfileAvatarLarge } from '@/components';
import StatsPill from '@/components/StatsPill';
import { AppUser } from '@/types';

const ProfileHeader = ({ user }: { user: AppUser }) => {
  return (
    <View style={styles.container}>
      <ProfileAvatarLarge source={user.photoURL || ''} />
      <Text style={styles.name}>{user.displayName}</Text>
      <Text style={styles.username}>@{user.username}</Text>
      <View style={styles.statsContainer}>
        <StatsPill label="Followers" value="0" />
        <StatsPill label="Following" value="0" />
        <StatsPill label="Likes" value="0" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    color: '#aaa',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});

export default ProfileHeader;
