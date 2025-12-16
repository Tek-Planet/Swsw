
import React from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';

interface CarouselItem {
  id: string;
  coverUrl: string | null;
  title?: string;
}

interface EventHeroCardProps {
  item: CarouselItem;
  scale: Animated.AnimatedInterpolation<number>;
}

const EventHeroCard: React.FC<EventHeroCardProps> = ({ item, scale }) => {
  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Image
        source={item.coverUrl ? { uri: item.coverUrl } : require('@/assets/images/placeholder.png')}
        style={styles.image}
      />
      {item.title && <Text style={styles.title}>{item.title}</Text>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 10,
    backgroundColor: '#333',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

export default EventHeroCard;
