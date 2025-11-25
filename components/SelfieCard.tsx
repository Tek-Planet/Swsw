
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import {Ionicons } from '@react-native-vector-icons/ionicons';

interface SelfieCardProps {
  imageUrl: string;
  uploadDate: string;
  onDelete: () => void;
  onReplace: () => void;
}

const SelfieCard: React.FC<SelfieCardProps> = ({ imageUrl, uploadDate, onDelete, onReplace }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
      <Text style={styles.date}>{uploadDate}</Text>
      <TouchableOpacity style={styles.menu} onPress={() => {}}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    marginHorizontal: 10,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 10,
  },
  thumbnail: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  date: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 5,
  },
  menu: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
});

export default SelfieCard;
