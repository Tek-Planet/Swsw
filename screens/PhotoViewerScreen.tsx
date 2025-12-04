import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type PhotoViewerScreenRouteProp = RouteProp<RootStackParamList, 'PhotoViewer'>;

const PhotoViewerScreen: React.FC<{ route: PhotoViewerScreenRouteProp }> = ({ route }) => {
  const navigation = useNavigation();
  const { photoUrl } = route.params;

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="contain" />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
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
