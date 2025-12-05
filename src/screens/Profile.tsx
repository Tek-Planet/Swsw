
import React from 'react';
import { View, ScrollView, StyleSheet, Image, Text } from 'react-native';
import EventCardSmall from '../components/EventCardSmall';
import { SecondaryButton } from '../components/Button';
import SectionTitle from '../components/SectionTitle';

const Profile: React.FC = () => {
  // Mock data, replace with actual data from your API
  const user = {
    avatar: 'https://picsum.photos/150',
    name: 'Jane Doe',
    bio: 'Event organizer and music lover. Catch me at the next big show!',
    followers: 1250,
    following: 340,
  };

  const pastEvents = [
    { thumbnail: 'https://picsum.photos/203', title: 'Indie Fest', host: 'Indie Events', category: 'Music', location: 'Brooklyn, NY', price: 45 },
    { thumbnail: 'https://picsum.photos/204', title: 'Food Truck Rally', host: 'City Eats', category: 'Food & Drink', location: 'Queens, NY', price: 0 },
  ];

  const upcomingEvents = [
    { thumbnail: 'https://picsum.photos/205', title: 'Summer Jam', host: 'Music Lovers Inc.', category: 'Music', location: 'Central Park, NY', price: 75 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.bio}>{user.bio}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{user.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{user.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
        <SecondaryButton title="Edit Profile" onPress={() => {}} />
      </View>

      <SectionTitle title="Upcoming Events" />
      {upcomingEvents.map((event, index) => (
        <EventCardSmall key={index} event={event} />
      ))}

      <SectionTitle title="Past Events" />
      {pastEvents.map((event, index) => (
        <EventCardSmall key={index} event={event} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bio: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#ccc',
  },
});

export default Profile;
