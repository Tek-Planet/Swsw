
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import EventCard from '@/components/EventCard';
import AlbumPreviewCard from '@/components/gallery/AlbumPreviewCard';
import { Header, TopNavBar } from '@/components/Header';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getEvent,
  listenToRecommendedEvents,
  listenToTrendingEvents,
  listenToUserUpcomingEvents,
} from '@/lib/services/eventService';
import { getUserAccessibleEventIds } from '@/lib/services/galleryService';
import { Event } from '@/types/event';

const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TopNavBar />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Header />
        <UpcomingEvents />
        <TrendingEvents />
        {/* <RecommendedEvents /> */}
        <YourAlbums />
        
      </ScrollView>
      {/* <FloatingActionButton /> */}
    </View>
  );
};

const YourAlbums: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!user) return;

      try {
        const eventIds = await getUserAccessibleEventIds(user.uid);

        if (eventIds.length === 0) {
          setLoading(false);
          return;
        }

        const events: (Event | null)[] = await Promise.all(eventIds.map((id: string) => getEvent(id)));
        const validEvents = events.filter((e): e is Event => e !== null);

        const eventsWithPhotos = validEvents.filter(e => e.photoCount && e.photoCount > 0);
        if (eventsWithPhotos.length > 0) {
          eventsWithPhotos.sort((a, b) => new Date(b.latestPhotoAt).getTime() - new Date(a.latestPhotoAt).getTime());
          setSelectedEvent(eventsWithPhotos[0]);
        } else {
          const upcomingEvents = validEvents.filter(e => new Date(e.startTime).getTime() > Date.now());
          if (upcomingEvents.length > 0) {
            setSelectedEvent(upcomingEvents[0]);
          } else {
            setSelectedEvent(validEvents[0] || null);
          }
        }
      } catch (error) {
        console.error("Error fetching album data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!selectedEvent) {
    return (
      <View style={styles.section}>
        <Text style={styles.placeholderText}>Your albums will appear here once you attend an event.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Albums</Text>
      <AlbumPreviewCard
        eventId={selectedEvent.id}
        title={selectedEvent.title}
        coverImageUrl={selectedEvent.coverImageUrl || selectedEvent.latestPhotoThumbUrl || null}
        photoCount={selectedEvent.photoCount || 0}
      />
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
      <Text style={styles.sectionTitle}>Trending</Text>
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
