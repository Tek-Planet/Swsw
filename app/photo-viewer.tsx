
import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

const PhotoViewerScreen: React.FC = () => {
  const router = useRouter();
  const { photoUrl } = useLocalSearchParams<{ photoUrl: string }>();

  return (
    <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 1,
    },
});

export default PhotoViewerScreen;
