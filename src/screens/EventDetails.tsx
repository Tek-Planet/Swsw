
import React from 'react';
import { View, ScrollView, StyleSheet, Image, Text } from 'react-native';
import HostBadge from '../components/HostBadge';
import DateTimeCard from '../components/DateTimeCard';
import LocationCard from '../components/LocationCard';
import TicketTierSelector from '../components/TicketTierSelector';
import Gallery from '../components/Gallery';
import { PrimaryButton } from '../components/Button';
import SectionTitle from '../components/SectionTitle';

const EventDetails: React.FC = () => {
  // Mock data, replace with actual data from your API
  const event = {
    coverImage: 'https://picsum.photos/800',
    title: 'Summer Music Festival',
    host: { avatar: 'https://picsum.photos/100', name: 'Music Lovers Inc.' },
    date: 'Saturday, August 12',
    time: '2:00 PM - 10:00 PM',
    location: 'Central Park',
    address: '59th to 110th Street, New York, NY',
    description: 'Join us for a full day of live music from your favorite artists! Enjoy food trucks, activities, and more.',
    gallery: ['https://picsum.photos/300', 'https://picsum.photos/301', 'https://picsum.photos/302', 'https://picsum.photos/303'],
    ticketTiers: [
      { name: 'General Admission', price: 75, quantity: 500 },
      { name: 'VIP', price: 150, quantity: 100 },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: event.coverImage }} style={styles.coverImage} />
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <HostBadge avatar={event.host.avatar} name={event.host.name} onFollow={() => {}} />
        <DateTimeCard date={event.date} time={event.time} />
        <LocationCard location={event.location} address={event.address} />
        <SectionTitle title="About the Event" />
        <Text style={styles.description}>{event.description}</Text>
        <SectionTitle title="Gallery" />
        <Gallery images={event.gallery} />
        <SectionTitle title="Get Your Tickets" />
        <TicketTierSelector tiers={event.ticketTiers} onSelect={() => {}} />
        <PrimaryButton title="Buy Tickets" onPress={() => {}} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    color: '#ccc',
    lineHeight: 22,
  },
});

export default EventDetails;
