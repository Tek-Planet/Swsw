import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';

import EventCard from "@/components/EventCard";
import AlbumPreviewCard from "@/components/gallery/AlbumPreviewCard";
import { Header, TopNavBar } from "@/components/Header";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getEvent,
  listenToRecommendedEvents,
  listenToTrendingEvents,
  listenToUserUpcomingEvents,
  listenToUserPastEvents,
} from "@/lib/services/eventService";
import {
  getEventAlbumPreview,
  getUserAccessibleEventIds,
} from "@/lib/services/galleryService";
import { Event } from "@/types/event";

const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TopNavBar />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Header />
        <EventsSection />
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
  const [albumPreview, setAlbumPreview] = useState<{
    coverPhotoUrl: string | null;
    photoCount: number;
  } | null>(null);

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const eventIds = await getUserAccessibleEventIds(user.uid);

        if (eventIds.length === 0) {
          setLoading(false);
          return;
        }

        const events: (Event | null)[] = await Promise.all(
          eventIds.map((id: string) => getEvent(id))
        );
        const validEvents = events.filter((e): e is Event => e !== null);

        let eventToShow: Event | null = null;
        const eventsWithPhotos = validEvents.filter(
          (e) => e.photoCount && e.photoCount > 0
        );
        if (eventsWithPhotos.length > 0) {
          eventsWithPhotos.sort(
            (a, b) =>
              new Date(b.latestPhotoAt).getTime() -
              new Date(a.latestPhotoAt).getTime()
          );
          eventToShow = eventsWithPhotos[0];
        } else {
          const upcomingEvents = validEvents.filter(
            (e) => new Date(e.startTime).getTime() > Date.now()
          );
          if (upcomingEvents.length > 0) {
            upcomingEvents.sort(
              (a, b) =>
                new Date(b.startTime).getTime() -
                new Date(a.startTime).getTime()
            );
            eventToShow = upcomingEvents[0];
          } else if (validEvents.length > 0) {
            validEvents.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            eventToShow = validEvents[0];
          }
        }

        setSelectedEvent(eventToShow);

        if (eventToShow) {
          const preview = await getEventAlbumPreview(eventToShow.id);
          setAlbumPreview(preview);
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
        <Text style={styles.placeholderText}>
          Your albums will appear here once you attend an event.
        </Text>
      </View>
    );
  }

  const hasPhotos = albumPreview && albumPreview.photoCount > 0;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Albums</Text>
      {hasPhotos && albumPreview ? (
        <AlbumPreviewCard
          eventId={selectedEvent.id}
          title={selectedEvent.title}
          coverImageUrl={albumPreview.coverPhotoUrl}
          photoCount={albumPreview.photoCount}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Photos coming soon for {selectedEvent.title}.
          </Text>
        </View>
      )}
    </View>
  );
};

const EventsSection: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      const listener = filter === 'Upcoming' 
        ? listenToUserUpcomingEvents
        : listenToUserPastEvents;

      const unsubscribe = listener(user.uid, (events: Event[]) => {
        setEvents(events);
      });

      return () => unsubscribe();
    }
  }, [user, filter]);

  const handleSelectFilter = (newFilter: 'Upcoming' | 'Past') => {
    setFilter(newFilter);
    setModalVisible(false);
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{filter} Events</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="options-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => handleSelectFilter('Upcoming')} style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSelectFilter('Past')} style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Past</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {events.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              showEnhanceGridButton={true}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No {filter.toLowerCase()} events yet.</Text>
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
          <Text style={styles.placeholderText}>
            No recommendations right now.
          </Text>
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
          <Text style={styles.placeholderText}>
            No trending events right now.
          </Text>
          <Text style={styles.placeholderSubText}>Check back later!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollViewContent: {
    paddingBottom: 80, 
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  horizontalScroll: {
    paddingBottom: 20,
  },
  placeholderContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 20,
  },
  placeholderText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
  },
  placeholderSubText: {
    color: "#666",
    fontSize: 14,
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 10,
    width: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOption: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default HomeScreen;
