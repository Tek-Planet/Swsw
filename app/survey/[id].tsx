
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
    if (questionId < surveyData.length) {
        router.push(`/survey/${questionId + 1}`);
    } else {
      router.push('/survey/results');
    }
  };

  const handleBack = () => {
    if (questionId > 1) {
        router.back();
    } else {
        router.replace('/survey');
    }
  };

  const handleAnswer = (questionId: number, answer: string | string[]) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const currentQuestion = surveyData[questionId-1];

  return (
    <SurveyContainer>
      <SurveyProgressIndicator
        current={questionId}
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
