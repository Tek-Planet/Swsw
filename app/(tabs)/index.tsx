
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';

import { TopNavBar, Header } from '@/components/Header';
import EventCard from '@/components/EventCard';
import RecentAlbum from '@/components/event/RecentAlbum';
import { useAuth } from '@/lib/context/AuthContext';
import {
  listenToUserUpcomingEvents,
  listenToRecommendedEvents,
  listenToTrendingEvents,
} from '@/lib/services/eventService';
import { Event } from '@/types/event';

const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TopNavBar />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Header />
        <UpcomingEvents />
        <RecommendedEvents />
        <RecentAlbum />
        <TrendingEvents />
      </ScrollView>
      {/* <FloatingActionButton /> */}
    </View>
  );
};

const UpcomingEvents: React.FC = () => {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user) {
      const unsubscribe = listenToUserUpcomingEvents(user.uid, (events: Event[]) => {
        setUpcomingEvents(events);
      });
      return () => unsubscribe();
    }
  }, [user]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming</Text>
      {upcomingEvents.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} showEnhanceGridButton={true} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No upcoming events yet.</Text>
          <Text style={styles.placeholderSubText}>
            Create an event or join one!
          </Text>
        </View>
      )}
    </View>
  );
};

const RecommendedEvents: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user && userProfile?.interests) {
      const unsubscribe = listenToRecommendedEvents(
        user.uid,
        userProfile.interests,
        (events: Event[]) => {
          setRecommendedEvents(events);
        }
      );
      return () => unsubscribe();
    }
  }, [user, userProfile]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recommended for You</Text>
      {recommendedEvents.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
          {recommendedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No recommendations right now.</Text>
          <Text style={styles.placeholderSubText}>
            Update your interests to get better recommendations.
          </Text>
        </View>
      )}
    </View>
  );
};

const TrendingEvents: React.FC = () => {
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);

  useEffect(() => {
    const unsubscribe = listenToTrendingEvents((events: Event[]) => {
      setTrendingEvents(events);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Trending in NYC</Text>
      {trendingEvents.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
          {trendingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No trending events right now.</Text>
          <Text style={styles.placeholderSubText}>Check back later!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollViewContent: {
    paddingBottom: 80, // To avoid being hidden by the FAB
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  placeholderContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginHorizontal: 20,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  placeholderSubText: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
});

export default HomeScreen;
