
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const ActivityFeed = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity (3)</Text>
      <View style={styles.post}>
        <Image source={{ uri: 'https://i.pravatar.cc/150?img=7' }} style={styles.avatar} />
        <View style={styles.postContent}>
          <Text style={styles.postText}>
            <Text style={styles.bold}>Abir B</Text> rsvped Going 😌
          </Text>
          <Text style={styles.timestamp}>2 hours ago</Text>
          <TouchableOpacity>
            <Text style={styles.reply}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity>
        <Text style={styles.loadMore}>Load more</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  post: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postContent: {
    flex: 1,
  },
  postText: {
    color: 'white',
    fontSize: 16,
  },
  bold: {
    fontWeight: 'bold',
  },
  timestamp: {
    color: 'gray',
    fontSize: 12,
    marginTop: 4,
  },
  reply: {
    color: '#6c63ff',
    marginTop: 8,
  },
  loadMore: {
    color: '#6c63ff',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
});

export default ActivityFeed;
