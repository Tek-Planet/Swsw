
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Event } from '@/types/event';
import EnhanceGridButton from './EnhanceGridButton';
import { auth } from '@/lib/firebase/firebaseConfig';

interface EventCardProps {
  event: Event;
  showEnhanceGridButton?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, showEnhanceGridButton }) => {
  const router = useRouter();
  const user = auth.currentUser;

  const hasPurchased = useMemo(() => {
    if (!user || !event.attendeeIds) {
      return false;
    }
    return event.attendeeIds.includes(user.uid);
  }, [user, event.attendeeIds]);

  if (!event) {
    return null;
  }

  const handleEnhanceGridPress = () => {
    router.push('/enhance-grid-survey');
  };

  const imageUrl = event.coverImageUrl || 'https://via.placeholder.com/150';

  const eventDate = event.startTime.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const eventTime = event.startTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isUpcoming = event.startTime > new Date() && event.status === 'published';

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => router.push(`/event/${event.id}`)}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.host}>by {event.hostName}</Text>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>{eventDate}</Text>
            <Text style={styles.detailsText}>{eventTime}</Text>
          </View>
        </View>
      </TouchableOpacity>
      {isUpcoming && (
        <View>
          {hasPurchased ? (
            <TouchableOpacity style={styles.viewTicketsButton} onPress={() => router.push({ pathname: '/event/tickets', params: { eventId: event.id } })}>
              <Text style={styles.viewTicketsButtonText}>View Tickets</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.buyButton} onPress={() => router.push(`/(ticket)/TicketSelectionScreen?eventId=${event.id}`)}>
              <Text style={styles.buyButtonText}>Buy Tickets</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {showEnhanceGridButton && (
        <>
          <View style={styles.divider} />
          <EnhanceGridButton onPress={handleEnhanceGridPress} />
          <Text style={styles.helperText}>Find new people to meet at this event.</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 250,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  content: {
    marginTop: 10,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  host: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  detailsText: {
    color: '#aaa',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 15,
  },
  helperText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  buyButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewTicketsButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  viewTicketsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventCard;
