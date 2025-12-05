
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ToggleSwitch, PrimaryButton, SecondaryButton } from '@/components';
import SectionCard from '@/components/SectionCard';

const ProfileSettings = ({ onSignOut }: { onSignOut: () => void }) => {
  const [isPrivate, setIsPrivate] = useState(false);
  const [notifications, setNotifications] = useState(true);

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
      <SecondaryButton title="Delete Account" onPress={() => {}} />
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
