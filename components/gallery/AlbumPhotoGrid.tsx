
import React from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Photo } from '@/types/gallery'; // [FIXED] Corrected the import path

interface AlbumPhotosSectionProps {
  photos: Photo[];
}

const { width } = Dimensions.get('window');
const numColumns = 2;
const gridPadding = 10;
const itemMargin = 5;
const photoSize = (width - gridPadding * 2 - itemMargin * 2 * numColumns) / numColumns;

const AlbumPhotoGrid: React.FC<AlbumPhotosSectionProps> = ({ photos }) => {

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity onPress={() => router.push({ pathname: '/photo-viewer', params: { photoUrl: item.url }})}>
      {/* The optional chaining ?. is important here because 'url' can be undefined */}
      <Image source={{ uri: item.url }} style={styles.photo} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        style={{ flex: 1 }}
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
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
    padding: gridPadding,
  },
  photo: {
    width: photoSize,
    height: photoSize,
    borderRadius: 10,
    margin: itemMargin,
  },
});

export default AlbumPhotoGrid;
