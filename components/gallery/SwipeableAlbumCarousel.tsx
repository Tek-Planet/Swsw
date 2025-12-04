
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Animated } from 'react-native';
import AlbumHeroCard from './AlbumHeroCard';
import { Album } from '../../data/gallery';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = 300;
const sideCardWidth = (screenWidth - cardWidth) / 2;

interface SwipeableAlbumCarouselProps {
  albums: Album[];
  onAlbumChange: (album: Album) => void;
}

const SwipeableAlbumCarousel: React.FC<SwipeableAlbumCarouselProps> = ({ albums, onAlbumChange }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    onAlbumChange(albums[activeIndex]);
  }, [activeIndex, albums, onAlbumChange]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={styles.container}>
      <FlatList
        data={albums}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * cardWidth,
            index * cardWidth,
            (index + 1) * cardWidth,
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
          });
          return <AlbumHeroCard album={item} scale={scale} />;
        }}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 20} 
        decelerationRate="fast"
        contentContainerStyle={styles.contentContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: sideCardWidth - 10, 
  },
});

export default SwipeableAlbumCarousel;
