
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { PrimaryButton, SecondaryButton } from './Button';
import ModalContainer from './ModalContainer';

interface AddLinkModalProps {
  visible: boolean;
  onClose: () => void;
  onAddLink: (platform: string, url: string) => void;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({ visible, onClose, onAddLink }) => {
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');

  return (
    <ModalContainer visible={visible} onClose={onClose}>
      <Text style={styles.title}>Add Custom Link</Text>
      <TextInput
        style={styles.input}
        placeholder="Platform (e.g., GitHub)"
        placeholderTextColor="#aaa"
        value={platform}
        onChangeText={setPlatform}
      />
      <TextInput
        style={styles.input}
        placeholder="URL"
        placeholderTextColor="#aaa"
        value={url}
        onChangeText={setUrl}
      />
      <PrimaryButton title="Add Link" onPress={() => onAddLink(platform, url)} />
      <SecondaryButton title="Cancel" onPress={onClose} />
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    fontSize: 16,
    width: 250,
  },
});

export default AddLinkModal;
