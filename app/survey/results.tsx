
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import SurveyContainer from '@/components/survey/SurveyContainer';
import RecommendationList from '@/components/recommendations/RecommendationList';
import CTAButton from '@/components/recommendations/CTAButton';
import { router } from 'expo-router';
import { recommendations } from '@/data/recommendations';

const SurveyResultsScreen: React.FC = () => (
  <SurveyContainer>
    <Text style={styles.title}>Your Event Matches</Text>
    <RecommendationList recommendations={recommendations} />
    <CTAButton title="Explore More People" onPress={() => {router.replace('/(tabs)')}} />
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
