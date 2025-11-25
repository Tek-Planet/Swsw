import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import SurveyContainer from '../components/survey/SurveyContainer';
import { AppHeader } from '../components/Header';
import SurveyQuestionCard from '../components/survey/SurveyQuestionCard';
import SurveySingleChoice from '../components/survey/SurveySingleChoice';
import SurveyMultiChoice from '../components/survey/SurveyMultiChoice';
import SurveyProgressIndicator from '../components/survey/SurveyProgressIndicator';
import SurveyNavigationBar from '../components/survey/SurveyNavigationBar';
import AnimatedSlideContainer from '../components/survey/AnimatedSlideContainer';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

type NavigationProps = StackNavigationProp<RootStackParamList, 'SurveyQuestionScreen'>;

const surveyData = [
    {
      id: 1,
      question: 'What’s your vibe for this event?',
      type: 'single',
      options: ['Chill', 'High-Energy', 'Social', 'Low-Key', 'Networking'],
    },
    {
      id: 2,
      question: 'Who do you want to meet?',
      type: 'multi',
      options: ['New friends', 'People with similar interests', 'Creatives', 'Professionals', 'Anyone fun'],
    },
    {
      id: 3,
      question: 'What are you looking forward to?',
      type: 'single',
      options: ['Dancing', 'Drinking', 'Deep conversations', 'Games', 'Exploring the venue'],
    },
  ];

interface AnimatedSlideContainerRef {
  slideIn: () => void;
  slideOut: () => void;
}

const SurveyQuestionScreen = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: string | string[]}>({});
  const navigation = useNavigation<NavigationProps>();
  const animatedSlideRef = useRef<AnimatedSlideContainerRef>(null);

  useEffect(() => {
    if (animatedSlideRef.current) {
      animatedSlideRef.current.slideIn();
    }
  }, [currentQuestionIndex]);

  const handleNext = () => {
    if (currentQuestionIndex < surveyData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      navigation.navigate('SurveyResultsScreen');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
        navigation.goBack();
    }
  };

  const handleAnswer = (questionId: number, answer: string | string[]) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const currentQuestion = surveyData[currentQuestionIndex];

  return (
    <SurveyContainer>
        <AppHeader title="Event Survey" />
      <SurveyProgressIndicator
        current={currentQuestionIndex + 1}
        total={surveyData.length}
      />
      <AnimatedSlideContainer ref={animatedSlideRef}>
        <SurveyQuestionCard question={{text: currentQuestion.question}} onAnswer={() => {}} />
        <View style={styles.optionsContainer}>
          {currentQuestion.type === 'single' ? (
            <SurveySingleChoice
              options={currentQuestion.options}
              onSelect={(option: string) => handleAnswer(currentQuestion.id, option)}
              selectedOption={answers[currentQuestion.id] as string}
            />
          ) : (
            <SurveyMultiChoice
              options={currentQuestion.options}
              onSelect={(selectedOptions: string[]) => handleAnswer(currentQuestion.id, selectedOptions)}
              selectedOptions={(answers[current.id] as string[]) || []}
            />
          )}
        </View>
      </AnimatedSlideContainer>
      <SurveyNavigationBar
        onNext={handleNext}
        onBack={handleBack}
        isNextDisabled={!answers[currentQuestion.id]}
      />
    </SurveyContainer>
  );
};

const styles = StyleSheet.create({
  optionsContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
});

export default SurveyQuestionScreen;
