
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import StickyTopBar from '@/components/StickyTopBar';
import EventHeroCard from '@/components/EventHeroCard';
import EventMetaCard from '@/components/EventMetaCard';
import HostInfo from '@/components/HostInfo';
import LocationCard from '@/components/LocationCard';
import DescriptionBlock from '@/components/DescriptionBlock';
import GuestList from '@/components/GuestList';
import PhotoAlbum from '@/components/PhotoAlbum';
import ActivityFeed from '@/components/ActivityFeed';
import FloatingRSVPBar from '@/components/FloatingRSVPBar';

const EventDetailScreen: React.FC = () => {
  const guests = [
    { id: '1', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', avatar: 'https://i.pravatar.cc/150?img=4' },
    { id: '5', avatar: 'https://i.pravatar.cc/150?img=5' },
  ];

  return (
    <View style={styles.container}>
      <StickyTopBar />
      <ScrollView>
        <View style={styles.headerSection}>
          <Text style={styles.casualTitle}>umm Saturday?</Text>
          <EventHeroCard eventName="hang" />
        </View>
        <EventMetaCard
          date="Saturday, Nov 22"
          time="7:00pm – 11:00pm"
          icon="calendar-outline"
        />
        <HostInfo
          hostName="Abir B"
          hostAvatar="https://i.pravatar.cc/150?img=6"
        />
        <LocationCard
          location="Mandalay On The Hudson"
          address="123 Main St, San Francisco, CA"
        />
        <DescriptionBlock text="Just a casual hangout. Bring your own drinks. Emojis and casual conversational tone. 🎉" />
        <PhotoAlbum />
        <GuestList guests={guests} total={32} />
        <ActivityFeed groupId="123" />
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Add to Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Get Tickets</Text>
        </TouchableOpacity>
      </View>
      <FloatingRSVPBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  headerSection: {
    paddingTop: 80, // space for the TopNavBar
    marginBottom: 20,
  },
  casualTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#000',
  },
  button: {
    backgroundColor: '#6c63ff',
    padding: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EventDetailScreen;
