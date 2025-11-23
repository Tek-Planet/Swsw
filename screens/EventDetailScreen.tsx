
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import TopNavBar from '../components/TopNavBar';
import EventHeroCard from '../components/EventHeroCard';
import EventMetaCard from '../components/EventMetaCard';
import HostInfo from '../components/HostInfo';
import RSVPActionBar from '../components/RSVPActionBar';
import DetailRow from '../components/DetailRow';
import PeopleRow from '../components/PeopleRow';

const EventDetailScreen = ({ navigation }) => {
  const people = [
    { id: '1', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', avatar: 'https://i.pravatar.cc/150?img=4' },
    { id: '5', avatar: 'https://i.pravatar.cc/150?img=5' },
  ];

  return (
    <View style={styles.container}>
      <TopNavBar title="Event Details" onBackPress={() => navigation.goBack()} />
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
        <RSVPActionBar />
        <View style={styles.additionalDetails}>
          <DetailRow
            icon="location-outline"
            label="Location"
            value="123 Main St, San Francisco, CA"
          />
          <DetailRow
            icon="document-text-outline"
            label="Description"
            value="Just a casual hangout. Bring your own drinks."
          />
          <PeopleRow people={people} />
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.floatingActionButton}>
        <Text style={styles.floatingActionButtonText}>Share</Text>
      </TouchableOpacity>
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
  additionalDetails: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 100, // above the bottom nav bar
    right: 20,
    backgroundColor: '#6c63ff',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  floatingActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventDetailScreen;
