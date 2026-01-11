import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import DescriptionBlock from "@/components/DescriptionBlock";
import EventHeroCard from "@/components/EventHeroCard";
import EventMetaCard from "@/components/EventMetaCard";
import FloatingRSVPBar from "@/components/FloatingRSVPBar";
import HostInfo from "@/components/HostInfo";
import PhotoAlbum from "@/components/PhotoAlbum";
import StickyTopBar from "@/components/StickyTopBar";
import TicketHoldersList from "@/components/TicketHoldersList";
import ActivityFeed from "@/components/event/ActivityFeed";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getProfilesForUserIds,
  listenToEvent,
} from "@/lib/services/eventService";
import { Event } from "@/types/event";
import { UserProfile } from "@/types/user";

// Define TicketHolder type inline
export interface TicketHolder {
  id: string;
  avatar: string;
  firstName: string;
}

// Define the shape expected by the HostInfo component
interface HostInfoProps {
  name: string;
  photoUrl?: string;
}

const EventDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.uid;

  const [event, setEvent] = useState<Event | null>(null);
  const [host, setHost] = useState<HostInfoProps | null>(null);
  const [ticketHolders, setTicketHolders] = useState<TicketHolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = listenToEvent(id, async (eventData) => {
      setEvent(eventData);
      if (eventData) {
        // Fetch host profile
        if (eventData.hostId) {
          const hostProfile = (
            await getProfilesForUserIds([eventData.hostId])
          ).get(eventData.hostId);
          if (hostProfile) {
            setHost({
              name: hostProfile.displayName,
              photoUrl: hostProfile.photoUrl,
            });
          }
        }

        // Fetch ticket holder profiles
        const profilesMap = await getProfilesForUserIds(eventData.attendeeIds);
        const holdersList: TicketHolder[] = Array.from(
          profilesMap.entries()
        ).map(([profId, profile]) => ({
          id: profId,
          avatar: profile.photoUrl || `https://i.pravatar.cc/150?u=${profId}`,
          firstName: profile.displayName,
        }));
        setTicketHolders(holdersList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const hasTicket = useMemo(() => {
    if (!userId || !event || !event.attendeeIds) return false;
    return event.attendeeIds.includes(userId);
  }, [userId, event]);

  const memoizedTicketHolders = useMemo(() => ticketHolders, [ticketHolders]);

  if (loading) {
    return (
      <ActivityIndicator
        style={styles.centerContainer}
        size="large"
        color="#fff"
      />
    );
  }

  if (!event) {
    return <Text style={styles.errorText}>Event not found.</Text>;
  }

  const eventDate = event.startTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const eventTime = event.startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <View style={styles.container}>
      <StickyTopBar />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <EventHeroCard eventName={event.title} imageUrl={event.coverImageUrl} />
        <EventMetaCard
          date={eventDate}
          time={eventTime}
          location={event.location.address || "TBD"}
          address={event.location.city}
        />
        {host && <HostInfo host={host} />}
        <DescriptionBlock text={event.description} />
        {hasTicket ? (
          <>
            <TicketHoldersList
              ticketHolders={memoizedTicketHolders}
              total={event.attendeeIds?.length || 0}
            />
            <PhotoAlbum eventId={id} />
          </>
        ) : (
          <View style={styles.lockedSection}>
            <Ionicons name="lock-closed" size={32} color="#A8A8A8" />
            <Text style={styles.lockedText}>
              Buy a ticket to see photos and who's going
            </Text>
          </View>
        )}
        {/* <ActivityFeed eventId={id} hasAccess={hasTicket} /> */}
      </ScrollView>
      <FloatingRSVPBar eventId={id} hasTicket={hasTicket} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContentContainer: {
    paddingBottom: 100, // To make space for the floating RSVP bar
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  lockedSection: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedText: {
    color: "#A8A8A8",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
});

export default EventDetailScreen;
