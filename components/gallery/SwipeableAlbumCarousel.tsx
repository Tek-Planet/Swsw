import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import AlbumHeroCard from './AlbumHeroCard';
import { Album } from '../../data/gallery';

interface SwipeableAlbumCarouselProps {
  albums: Album[];
  onAlbumChange: (album: Album) => void;
}

const SwipeableAlbumCarousel: React.FC<SwipeableAlbumCarouselProps> = ({ albums, onAlbumChange }) => {
  const onViewableItemsChanged = ({ viewableItems }: { viewableItems: Array<{ item: Album }> }) => {
    if (viewableItems.length > 0) {
      onAlbumChange(viewableItems[0].item);
    }
  };

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  return (
    <View style={styles.container}>
      <FlatList
        data={albums}
        renderItem={({ item }) => <AlbumHeroCard album={item} />}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
  },
});

export default SwipeableAlbumCarousel;
