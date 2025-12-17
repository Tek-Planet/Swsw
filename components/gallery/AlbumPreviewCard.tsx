
import { Link } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface AlbumPreviewCardProps {
  eventId: string;
  title: string;
  coverImageUrl: string | null;
  photoCount: number;
}

const AlbumPreviewCard: React.FC<AlbumPreviewCardProps> = ({ eventId, title, coverImageUrl, photoCount }) => {
  return (
    <Link href={{ pathname: '/gallery', params: { eventId } }} asChild>
      <View style={styles.card}>
        <Image source={{ uri: coverImageUrl || 'https://via.placeholder.com/150' }} style={styles.image} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {photoCount > 0 ? 'View your photos' : 'Photos coming soon'}
          </Text>
        </View>
      </View>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 15, padding: 15, alignItems: 'center', marginBottom: 10, },
  image: {
    width: 80, height: 80, borderRadius: 10,
  },
  textContainer: {
    padding: 10,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', }, subtitle: { color: '#aaa', fontSize: 14, marginTop: 5, },
});

export default AlbumPreviewCard;
