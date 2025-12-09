
import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

interface EventHeroCardProps {
  eventName: string;
  imageUrl?: string;
}

const EventHeroCard: React.FC<EventHeroCardProps> = ({ eventName, imageUrl }) => {
  const imageSource = imageUrl ? { uri: imageUrl } : require('@/assets/images/fallback-hero.png');

  return (
    <ImageBackground source={imageSource} style={styles.card} imageStyle={styles.imageStyle}>
      <View style={styles.overlay} />
      <Text style={styles.eventName}>{eventName}</Text>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 30,
    overflow: 'hidden', // Ensures the overlay and image conform to border radius
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  imageStyle: {
    borderRadius: 30,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // Darker overlay for better text contrast
  },
  eventName: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 10, // Add some padding to prevent text from touching the edges
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

export default EventHeroCard;
