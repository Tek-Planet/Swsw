
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SocialLinkItem, AddLinkModal, PrimaryButton } from '../../components';
import SectionCard from '../../components/SectionCard';

const LinkedAccounts = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [accounts, setAccounts] = useState([
    { platform: 'Instagram', username: 'johndoe', isConnected: true },
    { platform: 'Twitter', username: 'johndoe', isConnected: true },
    { platform: 'TikTok', isConnected: false },
  ]);

  const handleAddLink = (platform: string, url: string) => {
    // Logic to add the link
    setModalVisible(false);
  };

  return (
    <SectionCard>
      <Text style={styles.title}>Linked Accounts</Text>
      {accounts.map(account => (
        <SocialLinkItem
          key={account.platform}
          {...account}
          onConnect={() => {}}
          onDisconnect={() => {}}
        />
      ))}
       <View style={styles.buttonContainer}>
      <PrimaryButton title="Add Custom Link" onPress={() => setModalVisible(true)} />
      </View>
      <AddLinkModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddLink={handleAddLink}
      />
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
  buttonContainer: {
    marginTop: 20,
  },
});

export default LinkedAccounts;
