
import React from 'react';
import {  Image, StyleSheet, ScrollView } from 'react-native';

interface GalleryProps {
  images: string[];
}

const Gallery: React.FC<GalleryProps> = ({ images }) => {
  return (
    <ScrollView horizontal style={styles.gallery}>
      {images.map((image, index) => (
        <Image key={index} source={{ uri: image }} style={styles.image} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  gallery: {
    marginTop: 20,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
});

export default Gallery;
