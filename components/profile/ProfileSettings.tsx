
import { PrimaryButton, SecondaryButton, ToggleSwitch } from '@/components';
import SectionCard from '@/components/SectionCard';
import { useAuth } from '@/lib/context/AuthContext';
import { disableUserAccount } from '@/lib/firebase/userProfileService';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

const ProfileSettings = ({ onSignOut }: { onSignOut: () => void }) => {
  const { user } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleDisableAccount = async () => {
    if (!user) return;

    Alert.alert(
      "Delete Account",
      "Are you sure you want to Delete your account? You can recover it by signing in again.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "OK", 
          onPress: async () => {
            try {
              await disableUserAccount(user.uid);
              onSignOut();
            } catch (error) {
              console.error("Error disabling account:", error);
              Alert.alert("Error", "There was an issue disabling your account. Please try again.");
            }
          } 
        }
      ]
    );
  };

  return (
    <SectionCard>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Private Account</Text>
        <ToggleSwitch value={isPrivate} onValueChange={setIsPrivate} />
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Push Notifications</Text>
        <ToggleSwitch value={notifications} onValueChange={setNotifications} />
      </View>
      <View style={styles.buttonContainer}>
      <PrimaryButton title="Logout" onPress={onSignOut} />
      </View>
       <View style={styles.buttonContainer}>
      <SecondaryButton title="Delete Account" onPress={handleDisableAccount} />
      </View>
    </SectionCard>
  );
};

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default ProfileSettings;
