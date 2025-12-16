
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { auth } from '../../lib/firebase/firebaseConfig';

import { getProfilesForUserIds, listenToEvent } from '@/lib/services/eventService';
import { Event } from '@/types/event';

import ActivityFeed from '@/components/ActivityFeed';
import DescriptionBlock from '@/components/DescriptionBlock';
import EventHeroCard from '@/components/EventHeroCard';
import EventMetaCard from '@/components/EventMetaCard';
import FloatingRSVPBar from '@/components/FloatingRSVPBar';
import GuestList, { Guest } from '@/components/GuestList';
import HostInfo from '@/components/HostInfo';
import PhotoAlbum from '@/components/PhotoAlbum';
import StickyTopBar from '@/components/StickyTopBar';

const EventDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasTicket, setHasTicket] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (typeof id !== 'string') {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToEvent(id, async (fetchedEvent) => {
      if (fetchedEvent) {
        setEvent(fetchedEvent);
        if (userId && fetchedEvent.attendeeIds.includes(userId)) {
            setHasTicket(true);
        }
        if (fetchedEvent.attendeeIds && fetchedEvent.attendeeIds.length > 0) {
          const profilesMap = await getProfilesForUserIds(fetchedEvent.attendeeIds);
          const guestList = Array.from(profilesMap.entries()).map(([userId, profile]) => ({
            id: userId,
            avatar: profile.photoUrl || `https://i.pravatar.cc/150?u=${userId}`,
            firstName: profile.displayName,
          }));
          setGuests(guestList);
        }
      } else {
        setEvent(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, userId]);

  const memoizedGuestList = useMemo(() => guests, [guests]);

  if (loading) {
    return <ActivityIndicator style={styles.centerContainer} size="large" color="#fff" />;
  }

  if (!event) {
    return <Text style={styles.errorText}>Event not found.</Text>;
  }

  const eventDate = event.startTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const eventTime = `${event.startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })} – ${event.endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  const host = { name: event.hostName, photoUrl: event.hostAvatarUrl };

  return (
    <View style={styles.container}>
      <StickyTopBar />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <EventHeroCard eventName={event.title} imageUrl={event.coverImageUrl} />
        <EventMetaCard date={eventDate} time={eventTime} location={event.location.address || 'TBD'} address={event.location.city} />
        <HostInfo host={host} />
        <DescriptionBlock text={event.description} />
        <GuestList guests={memoizedGuestList} total={event.attendeeIds.length} />
        <PhotoAlbum />
        <ActivityFeed groupId="123" />
      </ScrollView>
      {hasTicket && <FloatingRSVPBar />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContentContainer: { paddingHorizontal: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 50 },
});

export default EventDetailScreen;
