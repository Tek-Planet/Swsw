
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ProfileHeader from '@/components/profile/ProfileHeader';
import MySelfies from '@/components/profile/MySelfies';
import ProfileDetails from '@/components/profile/ProfileDetails';
import LinkedAccounts from '@/components/profile/LinkedAccounts';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { useAuth } from '@/lib/context/AuthContext';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader />
      <MySelfies />
      <ProfileDetails />
      <LinkedAccounts />
      <ProfileSettings onSignOut={signOut} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default ProfileScreen;
