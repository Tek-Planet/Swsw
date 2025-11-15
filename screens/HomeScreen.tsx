
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { TopNavBar, Header } from '../components/Header';

const HomeScreen = () => {
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
      <FloatingActionButton />
    </View>
  );
};

const UpcomingEvents = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Upcoming</Text>
    <View style={styles.eventCard}>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTime}>Next Sat: 7 pm</Text>
        <Text style={styles.eventName}>hang</Text>
        <Text style={styles.eventHost}>hosted by Abir B</Text>
      </View>
      <TouchableOpacity style={styles.goingButton}>
        <Text style={styles.goingButtonText}>GOING</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.suggestionText}>umm Saturday?</Text>
  </View>
);

const RecommendedEvents = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recommended</Text>
      <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
        <View style={styles.recommendedEventCard}>
          <Image source={{uri: 'https://images.unsplash.com/photo-1597159282583-034a3e9d0c64?w=200&h=200&fit=crop'}} style={styles.recommendedEventImage} />
          <Text style={styles.recommendedEventTitle}>Monsteras and Mimosas: Sprout Social</Text>
          <Text style={styles.recommendedEventHost}>hosted by You</Text>
          <Text style={styles.status}>Finding a time...</Text>
        </View>
        <View style={styles.recommendedEventCard}>
        <Image source={{uri: 'https://images.unsplash.com/photo-1597159282583-034a3e9d0c64?w=200&h=200&fit=crop'}} style={styles.recommendedEventImage} />
          <Text style={styles.recommendedEventTitle}>Monsteras and Mimosas: Sprout Social</Text>
          <Text style={styles.recommendedEventHost}>hosted by You</Text>
          <Text style={styles.status}>Finding a time...</Text>
        </View>
      </ScrollView>
    </View>
  );

  const TrendingEvents = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Trending in NYC</Text>
      <View style={styles.trendingEventCard}>
        <View style={styles.trendingEventHeader}>
          <Text style={styles.trendingEventTitle}>It’s in the Cage</Text>
          <TouchableOpacity>
            <Text style={styles.joinButton}>Join</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.trendingEventSubtitle}>Public events you can crash</Text>
        <Image source={{uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=200&fit=crop'}} style={styles.trendingEventImage} />
        <View style={styles.attendees}>
          <Text style={styles.attendeeText}>Olivia (ned) is going</Text>
        </View>
      </View>
    </View>
  );

const FloatingActionButton = () => (
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
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  eventDetails: {},
  eventTime: {
    color: '#aaa',
    fontSize: 14,
  },
  eventName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  eventHost: {
    color: '#aaa',
    fontSize: 14,
  },
  goingButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  goingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  suggestionText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  horizontalScroll: {
    paddingBottom: 20,
  },
  recommendedEventCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 250,
  },
  recommendedEventImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  recommendedEventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  recommendedEventHost: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
  status: {
    color: '#6c63ff',
    fontSize: 14,
    marginTop: 10,
  },
  trendingEventCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  trendingEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingEventTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  joinButton: {
    color: '#6c63ff',
    fontWeight: 'bold',
  },
  trendingEventSubtitle: {
    color: '#aaa',
    fontSize: 14,
    marginVertical: 10,
  },
  trendingEventImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  attendees: {
    marginTop: 10,
  },
  attendeeText: {
    color: '#fff',
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
