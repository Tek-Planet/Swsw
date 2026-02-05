import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import FilterModal from "@/components/FilterModal";
import { AppHeader } from "@/components/Header";
import { useAuth } from "@/lib/context/AuthContext";
import {
  listenToUserPastEvents,
  listenToUserUpcomingEvents,
} from "@/lib/services/eventService";
import { Event } from "@/types/event";

const EventsScreen: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<"Upcoming" | "Past">("Upcoming");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      const listener =
        filter === "Upcoming"
          ? listenToUserUpcomingEvents
          : listenToUserPastEvents;

      const unsubscribe = listener(user.uid, (newEvents: Event[]) => {
        setEvents(newEvents);
      });

      return () => unsubscribe();
    }
  }, [user, filter]);

  const handleSelectFilter = (newFilter: "Upcoming" | "Past") => {
    setFilter(newFilter);
    setModalVisible(false);
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <Link href={`/event/${item.id}`} asChild>
      <TouchableOpacity style={styles.eventCard}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDate}>
          {new Date(item.startTime).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title={`${filter} Events`}
        rightChild={
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="options-outline" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <FilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectFilter={handleSelectFilter}
      />

      {events.length > 0 ? (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            No {filter.toLowerCase()} events yet.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  eventCard: {
    backgroundColor: "#1c1c1e",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  eventDate: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 5,
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 20,
    backgroundColor: "#6c63ff",
    borderRadius: 28,
    elevation: 8,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#999",
    fontSize: 18,
  },
});

export default EventsScreen;
