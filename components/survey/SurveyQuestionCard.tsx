
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SurveySingleChoice from './SurveySingleChoice';
import SurveyMultiChoice from './SurveyMultiChoice';

interface SurveyQuestionCardProps {
  question: any;
  onAnswer: (answer: any) => void;
}

const SurveyQuestionCard: React.FC<SurveyQuestionCardProps> = ({ question, onAnswer }) => {
  const renderAnswerComponent = () => {
    switch (question.type) {
      case 'single':
        return <SurveySingleChoice options={question.options} onSelect={onAnswer} />;
      case 'multiple':
        return <SurveyMultiChoice options={question.options} onSelect={onAnswer} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.questionText}>{question.text}</Text>
      {renderAnswerComponent()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginTop: 45,
    marginBottom:20,
    width: '100%',
  },
  questionText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default SurveyQuestionCard;
