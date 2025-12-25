
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SurveyMultiChoice from './SurveyMultiChoice';
import SurveySingleChoice from './SurveySingleChoice';

interface SurveyQuestionCardProps {
  question: any;
  onAnswer: (answer: any) => void;
  answer?: string | string[] | null;
}

const SurveyQuestionCard: React.FC<SurveyQuestionCardProps> = ({ question, onAnswer, answer }) => {
  const renderAnswerComponent = () => {
    switch (question.type) {
      case 'single':
        return <SurveySingleChoice options={question.options} onSelect={onAnswer} selectedOption={answer as string | null} />;
      case 'multiple':
        return <SurveyMultiChoice options={question.options} onSelect={onAnswer} selectedOptions={answer as string[]} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.questionText}>{question.question}</Text>
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
