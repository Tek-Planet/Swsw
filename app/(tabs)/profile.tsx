
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ProfileHeader from '@/components/profile/ProfileHeader';
import MySelfies from '@/components/profile/MySelfies';
import ProfileDetails from '@/components/profile/ProfileDetails';
import LinkedAccounts from '@/components/profile/LinkedAccounts';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { useAuth } from '@/lib/context/AuthContext';
import { listenToUserProfile } from '@/lib/firebase/userProfileService';
import { UserProfile } from '@/types';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = listenToUserProfile(user.uid, (profile) => {
        setUserProfile(profile);
      });
      return () => unsubscribe();
    }
  }, [user]);

  if (!user || !userProfile) return null;

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader userProfile={userProfile} />
      <MySelfies />
      <ProfileDetails userProfile={userProfile} />
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
