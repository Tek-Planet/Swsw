
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProfileAvatarLarge } from '@/components';
import StatsPill from '@/components/StatsPill';

const ProfileHeader = () => {
  return (
    <View style={styles.container}>
      <ProfileAvatarLarge source={'https://randomuser.me/api/portraits/men/1.jpg'} />
      <Text style={styles.name}>John Doe</Text>
      <Text style={styles.username}>@johndoe</Text>
      <View style={styles.statsContainer}>
        <StatsPill label="Followers" value="1.2M" />
        <StatsPill label="Following" value="120" />
        <StatsPill label="Likes" value="4.5M" />
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
