import React from 'react';
import { Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';

interface PhotoTileProps {
  photoUrl: string;
}

type NavigationProps = StackNavigationProp<RootStackParamList, 'PhotoViewer'>;

const PhotoTile: React.FC<PhotoTileProps> = ({ photoUrl }) => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <TouchableOpacity onPress={() => navigation.navigate('PhotoViewer', { photoUrl })}>
      <Image source={{ uri: photoUrl }} style={styles.photo} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  photo: {
    width: 100,
    height: 100,
    margin: 5,
  },
});

export default PhotoTile;
