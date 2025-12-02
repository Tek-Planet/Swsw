
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons';
import { TopNavBar, Header } from '../components/Header';
import EventCard from '../components/EventCard';
import { upcomingEvents, recommendedEvents, trendingEvents } from '../mock/events';

const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TopNavBar />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Header />
        <UpcomingEvents />
        <RecommendedEvents />
        <TrendingEvents />
      </ScrollView>
      {/* <FloatingActionButton /> */}
    </View>
  );
};

const UpcomingEvents: React.FC = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Upcoming</Text>
    <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
      {upcomingEvents.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </ScrollView>
  </View>
);

const RecommendedEvents: React.FC = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recommended</Text>
      <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
        {recommendedEvents.map(event => (
            <EventCard key={event.id} event={event} />
        ))}
      </ScrollView>
    </View>
  );

  const TrendingEvents: React.FC = () => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trending in NYC</Text>
        {trendingEvents.map(event => (
            <EventCard key={event.id} event={event} />
        ))}
    </View>
  );

const FloatingActionButton: React.FC = () => (
  <TouchableOpacity style={styles.fab}>
    <Icon name="add" size={30} color="#fff" />
  </TouchableOpacity>
);

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
});

export default HomeScreen;
