
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import SurveyContainer from '@/components/survey/SurveyContainer';
import SurveyQuestionCard from '@/components/survey/SurveyQuestionCard';
import SurveySingleChoice from '@/components/survey/SurveySingleChoice';
import SurveyMultiChoice from '@/components/survey/SurveyMultiChoice';
import SurveyProgressIndicator from '@/components/survey/SurveyProgressIndicator';
import SurveyNavigationBar from '@/components/survey/SurveyNavigationBar';
import AnimatedSlideContainer from '@/components/survey/AnimatedSlideContainer';
import { router, useLocalSearchParams } from 'expo-router';
import { surveyData } from '@/data/survey';

interface AnimatedSlideContainerRef {
  slideIn: () => void;
  slideOut: () => void;
}

const SurveyQuestionScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const questionId = parseInt(id, 10);
  const [answers, setAnswers] = useState<{[key: number]: string | string[]}>({});
  const animatedSlideRef = useRef<AnimatedSlideContainerRef>(null);

  useEffect(() => {
    if (animatedSlideRef.current) {
      animatedSlideRef.current.slideIn();
    }
  }, [questionId]);

  const handleNext = () => {
    // Check if there is a next question
    const nextQuestion = surveyData.find(q => q.id === questionId + 1);
    if (nextQuestion) {
        router.push(`/survey/${questionId + 1}`);
    } else {
      // If not, all questions are answered, navigate to results
      router.push('/survey/results');
    }
  };

  const handleBack = () => {
    if (questionId > 1) {
        router.back();
    } else {
        // If on the first question, go back to the intro screen
        router.replace('/survey');
    }
  };

  const handleAnswer = (questionId: number, answer: string | string[]) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  // Use .find() for a more robust way to get the current question by its id
  const currentQuestion = surveyData.find(q => q.id === questionId);

  // Handle case where question might not be found
  if (!currentQuestion) {
    return (
        <SurveyContainer>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: '#fff'}}>Question not found.</Text>
            </View>
        </SurveyContainer>
    );
  }

  return (
    <SurveyContainer>
      <SurveyProgressIndicator
        current={questionId}
        total={surveyData.length}
      />
      <AnimatedSlideContainer ref={animatedSlideRef}>
        {/* Pass the question text directly as a string */}
        <SurveyQuestionCard question={currentQuestion.question} onAnswer={() => {}} />
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
              selectedOptions={(answers[currentQuestion.id] as string[]) || []}
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
