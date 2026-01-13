import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
      <StatusBar barStyle="light-content" />
      <AppHeader
        title={`${filter} Events`}
        rightChild={
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="options-outline" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => handleSelectFilter("Upcoming")}
              style={styles.modalOption}
            >
              <Text style={styles.modalOptionText}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSelectFilter("Past")}
              style={styles.modalOption}
            >
              <Text style={styles.modalOptionText}>Past</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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

      <Link href={{ pathname: "/" }} asChild>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </Link>
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#2c2c2e",
    borderRadius: 10,
    padding: 10,
    width: "60%",
  },
  modalOption: {
    paddingVertical: 15,
    alignItems: "center",
  },
  modalOptionText: {
    color: "#fff",
    fontSize: 18,
  },
});

export default EventsScreen;
