
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Animated, ListRenderItemInfo } from 'react-native';
import EventHeroCard from './EventHeroCard';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = 300;
const sideCardWidth = (screenWidth - cardWidth) / 2;

interface CarouselItem {
  id: string;
  coverUrl: string | null;
  title?: string;
}

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as new () => FlatList<CarouselItem>;

interface SwipeableEventCarouselProps {
  items: CarouselItem[];
  onFocusChange: (itemId: string) => void;
  initialIndex?: number;
}

const SwipeableEventCarousel: React.FC<SwipeableEventCarouselProps> = ({ items, onFocusChange, initialIndex = 0 }) => {
  const scrollX = useRef(new Animated.Value(initialIndex * (cardWidth + 20))).current;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList<CarouselItem>>(null);

  useEffect(() => {
    if (items.length > 0 && activeIndex < items.length) {
      onFocusChange(items[activeIndex].id);
    }
  }, [activeIndex, items, onFocusChange]);

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
        data={items}
        renderItem={({ item, index }: ListRenderItemInfo<CarouselItem>) => {
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
          return <EventHeroCard item={item} scale={scale} />;
        }}
        keyExtractor={(item: CarouselItem) => item.id}
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
        initialScrollIndex={initialIndex}
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

export default SwipeableEventCarousel;
