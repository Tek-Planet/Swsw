
import ProfileDetails from '@/components/profile/ProfileDetails';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { useAuth } from '@/lib/context/AuthContext';
import { listenToUserProfile } from '@/lib/firebase/userProfileService';
import { UserProfile } from '@/types';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

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
      <ProfileHeader userProfile={userProfile} user={user} />
      {/* <MySelfies /> */}
      <ProfileDetails userProfile={userProfile} />
      {/* <LinkedAccounts /> */}
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
