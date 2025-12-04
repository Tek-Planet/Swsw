
import React from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Photo } from '../../data/gallery';
import { RootStackParamList } from '../../types';

interface AlbumPhotosSectionProps {
  photos: Photo[];
}

const AlbumPhotoGrid: React.FC<AlbumPhotosSectionProps> = ({ photos }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PhotoViewer', { photoUrl: item.url })}>
      <Image source={{ uri: item.url }} style={styles.photo} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gridContainer: {
    padding: 10,
  },
  photo: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    margin: 5,
  },
});

export default AlbumPhotoGrid;
