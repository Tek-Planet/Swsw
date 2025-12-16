
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Animated, ListRenderItemInfo } from 'react-native';
import AlbumHeroCard from './AlbumHeroCard';
import { Album } from '@/types/gallery';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = 300;
const sideCardWidth = (screenWidth - cardWidth) / 2;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as new () => FlatList<Album>;

interface SwipeableAlbumCarouselProps {
  albums: Album[];
  onAlbumChange: (album: Album) => void;
  initialAlbumIndex?: number;
}

const SwipeableAlbumCarousel: React.FC<SwipeableAlbumCarouselProps> = ({ albums, onAlbumChange, initialAlbumIndex = 0 }) => {
  const scrollX = useRef(new Animated.Value(initialAlbumIndex * (cardWidth + 20))).current;
  const [activeIndex, setActiveIndex] = useState(initialAlbumIndex);
  const flatListRef = useRef<FlatList<Album>>(null);

  useEffect(() => {
    if (albums.length > 0 && activeIndex < albums.length) {
      onAlbumChange(albums[activeIndex]);
    }
  }, [activeIndex, albums, onAlbumChange]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        ref={flatListRef}
        data={albums}
        renderItem={({ item, index }: ListRenderItemInfo<Album>) => {
          const inputRange = [
            (index - 1) * (cardWidth + 20),
            index * (cardWidth + 20),
            (index + 1) * (cardWidth + 20),
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
          });
          return <AlbumHeroCard album={item} scale={scale} />;
        }}
        keyExtractor={(item: Album) => item.id}
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
        initialScrollIndex={initialAlbumIndex}
        getItemLayout={(_data, index) => ({
          length: cardWidth + 20,
          offset: (cardWidth + 20) * index,
          index,
        })}
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
