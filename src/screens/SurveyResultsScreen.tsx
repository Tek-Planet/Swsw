import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SurveyContainer from '../components/survey/SurveyContainer';
import RecommendationList from '../components/recommendations/RecommendationList';
import CTAButton from '../components/recommendations/CTAButton';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type SurveyResultsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SurveyResultsScreen'
>;

const recommendations = [
  {
    id: '1',
    name: 'Jane Doe',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    descriptor: 'Similar vibe: Chill',
    interests: ['Music', 'Art'],
  },
  {
    id: '2',
    name: 'John Smith',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
    descriptor: 'Enjoys deep conversations',
    interests: ['Technology', 'Gaming'],
  },
  {
    id: '3',
    name: 'Peter Jones',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
    descriptor: 'Looking for new friends',
    interests: ['Sports', 'Movies'],
  },
];

const SurveyResultsScreen: React.FC<{ navigation: SurveyResultsScreenNavigationProp }> = ({navigation}) => (
  <SurveyContainer>
    <Text style={styles.title}>Your Event Matches</Text>
    <RecommendationList recommendations={recommendations} />
    <CTAButton title="Explore More People" onPress={() => {navigation.navigate('Home')}} />
  </SurveyContainer>
);

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default SurveyResultsScreen;
