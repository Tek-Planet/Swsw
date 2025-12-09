
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Event } from '@/types/event';
import { UserProfile } from '@/types/user';
import { listenToEvent, getProfilesForUserIds } from '@/lib/services/eventService';

import StickyTopBar from '@/components/StickyTopBar';
import EventHeroCard from '@/components/EventHeroCard';
import EventMetaCard from '@/components/EventMetaCard';
import HostInfo from '@/components/HostInfo';
import LocationCard from '@/components/LocationCard';
import DescriptionBlock from '@/components/DescriptionBlock';
import GuestList, { Guest } from '@/components/GuestList';
import PhotoAlbum from '@/components/PhotoAlbum';
import ActivityFeed from '@/components/ActivityFeed';
import FloatingRSVPBar from '@/components/FloatingRSVPBar';

const EventDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof id !== 'string') {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToEvent(id, async (fetchedEvent) => {
      if (fetchedEvent) {
        setEvent(fetchedEvent);
        // Fetch guest profiles
        if (fetchedEvent.attendeeIds && fetchedEvent.attendeeIds.length > 0) {
          const profilesMap = await getProfilesForUserIds(fetchedEvent.attendeeIds);
          const guestList = Array.from(profilesMap.entries()).map(([userId, profile]) => ({
            id: userId,
            avatar: profile.photoURL || 'https://i.pravatar.cc/150?u=${userId}', // Fallback avatar
          }));
          setGuests(guestList);
        }
      } else {
        setEvent(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const memoizedGuestList = useMemo(() => guests, [guests]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Event not found.</Text>
      </View>
    );
  }

  const eventDate = event.startTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const eventTime = `${event.startTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })} – ${event.endTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;

  return (
    <View style={styles.container}>
      <StickyTopBar />
      <ScrollView>
        <View style={styles.headerSection}>
          <Text style={styles.casualTitle}>{event.subtitle || ''}</Text>
          <EventHeroCard eventName={event.title} imageUrl={event.coverImageUrl} />
        </View>
        <EventMetaCard date={eventDate} time={eventTime} icon="calendar-outline" />
        <HostInfo hostName={event.hostName} hostAvatar={event.hostAvatarUrl || 'https://via.placeholder.com/150'} />
        <LocationCard
          location={event.location.address || 'Location TBD'}
          address={event.location.city || ''}
        />
        <DescriptionBlock text={event.description} />
        <PhotoAlbum />
        {memoizedGuestList.length > 0 && (
            <GuestList guests={memoizedGuestList} total={event.attendeesCount} />
        )}
        <ActivityFeed groupId="123" />
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Add to Calendar</Text>
        </TouchableOpacity>
      </View>
      <FloatingRSVPBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
  headerSection: {
    paddingTop: 80, 
    marginBottom: 20,
  },
  casualTitle: {
    color: '#aaa',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default EventDetailScreen;
