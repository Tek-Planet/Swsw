
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons';
import { TopNavBar, Header } from '../components/Header';
import EventCard from '../components/EventCard';
import { upcomingEvents, recommendedEvents, trendingEvents } from '../mock/events';

const EventsListScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TopNavBar />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Header />
        <YourHostedEvents />
        <DiscoverEvents />
      </ScrollView>
      <FloatingActionButton />
    </View>
  );
};

const YourHostedEvents: React.FC = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Your Hosted Events</Text>
    {upcomingEvents.map(event => (
      <EventCard key={event.id} event={event} />
    ))}
  </View>
);

const DiscoverEvents: React.FC = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Discover Events</Text>
      <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
        {recommendedEvents.map(event => (
            <EventCard key={event.id} event={event} />
        ))}
      </ScrollView>
    </View>
  );

const FloatingActionButton: React.FC = () => (
  <TouchableOpacity style={styles.fab}>
    <Icon name="add" size={30} color="#fff" />
    <Text style={styles.fabText}>Create Event</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
      },
      scrollViewContent: {
        paddingBottom: 80,
      },
      section: {
        padding: 20,
      },
      sectionTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      horizontalScroll: {
        paddingBottom: 20,
      },
      fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#6c63ff',
        borderRadius: 30,
        width: 150,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#6c63ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
      },
      fabText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10,
      }
});

export default EventsListScreen;
