
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { auth, db } from '../../lib/firebase/firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { getProfilesForUserIds, listenToEvent } from '@/lib/services/eventService';
import { Event } from '@/types/event';

import ActivityFeed from '@/components/event/ActivityFeed';
import DescriptionBlock from '@/components/DescriptionBlock';
import EventHeroCard from '@/components/EventHeroCard';
import EventMetaCard from '@/components/EventMetaCard';
import FloatingRSVPBar from '@/components/FloatingRSVPBar';
import TicketHoldersList, { TicketHolder } from '@/components/TicketHoldersList';
import HostInfo from '@/components/HostInfo';
import PhotoAlbum from '@/components/PhotoAlbum';
import StickyTopBar from '@/components/StickyTopBar';

const EventDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketHolders, setTicketHolders] = useState<TicketHolder[]>([]);
  const [totalTicketHolders, setTotalTicketHolders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasTicket, setHasTicket] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (typeof id !== 'string') {
      setLoading(false);
      return;
    }

    const unsubscribeEvent = listenToEvent(id, (fetchedEvent) => {
      if (fetchedEvent) {
        setEvent(fetchedEvent);
      } else {
        setEvent(null);
        setLoading(false);
      }
    });

    return () => unsubscribeEvent();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const ordersQuery = query(collection(db, 'events', id, 'orders'), where('status', '==', 'paid'));

    const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
      setTotalTicketHolders(snapshot.size);

      if (snapshot.empty) {
        setTicketHolders([]);
        setHasTicket(false);
        setLoading(false);
        return;
      }

      const userIds = snapshot.docs.map(doc => doc.data().userId);
      if (userId) {
        setHasTicket(userIds.includes(userId));
      }

      const uniqueUserIds = [...new Set(userIds)];
      const profilesMap = await getProfilesForUserIds(uniqueUserIds);
      
      const holdersList = Array.from(profilesMap.entries()).map(([profId, profile]) => ({
        id: profId,
        avatar: profile.photoUrl || `https://i.pravatar.cc/150?u=${profId}`,
        firstName: profile.displayName,
      }));
      
      setTicketHolders(holdersList);
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, [id, userId]);

  const memoizedTicketHolders = useMemo(() => ticketHolders, [ticketHolders]);

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
        <TicketHoldersList ticketHolders={memoizedTicketHolders} total={totalTicketHolders} />
        <PhotoAlbum eventId={id} />
        <ActivityFeed eventId={id} />
      </ScrollView>
      <FloatingRSVPBar eventId={id} hasTicket={hasTicket} />
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
