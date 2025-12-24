
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../lib/firebase/firebaseConfig';
import { SurveyQuestion } from '../types/event';

import SurveyContainer from '../components/survey/SurveyContainer';
import SurveyQuestionCard from '../components/survey/SurveyQuestionCard';
import SurveyNavigationBar from '../components/survey/SurveyNavigationBar';

// Define the structure for answers being collected
interface Answer {
  questionId: string;
  answer: string | string[];
}

export default function SurveyQuestionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId: string; questionIndex?: string }>();
  const eventId = params.eventId as string;
  const initialIndex = params.questionIndex ? parseInt(params.questionIndex, 10) : 0;

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch questions for the event when the screen loads
  useEffect(() => {
    if (!eventId) return;
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const questionsRef = collection(db, 'events', eventId, 'survey');
        const snapshot = await getDocs(questionsRef);
        const fetchedQuestions = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as SurveyQuestion))
            .sort((a, b) => a.order - b.order);
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Error fetching survey questions:", error);
        Alert.alert("Error", "Could not load survey questions. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [eventId]);

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => {
      const existingAnsIndex = prev.findIndex(a => a.questionId === questionId);
      if (existingAnsIndex > -1) {
        const updated = [...prev];
        updated[existingAnsIndex] = { questionId, answer };
        return updated;
      } else {
        return [...prev, { questionId, answer }];
      }
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        const functions = getFunctions();
        const processSurvey = httpsCallable(functions, 'processSurveyAndFindMatches');
        
        await processSurvey({ eventId, answers });

        // Navigate to the results screen after successful submission
        router.replace({ 
            pathname: '/SurveyResultsScreen', 
            params: { eventId } 
        });

    } catch (error: any) {
        console.error("Error submitting survey:", error);
        Alert.alert("Submission Failed", error.message || "An unexpected error occurred. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <SurveyContainer><ActivityIndicator size="large" color="#fff" /></SurveyContainer>;
  }

  if (questions.length === 0) {
    return (
        <SurveyContainer>
            <Text style={styles.errorText}>No survey questions found for this event.</Text>
            <TouchableOpacity onPress={() => router.back()}><Text style={{color: '#4a90e2'}}>Go Back</Text></TouchableOpacity>
        </SurveyContainer>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)?.answer;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <SurveyContainer>
        <SurveyQuestionCard 
            question={currentQuestion}
            answer={currentAnswer}
            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
        />
        <SurveyNavigationBar
            onBack={handleBack}
            onNext={isLastQuestion ? handleSubmit : handleNext}
            isLast={isLastQuestion}
            isSubmitting={isSubmitting}
        />
    </SurveyContainer>
  );
}

const styles = StyleSheet.create({
    errorText: {
        color: '#d9534f',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20
    },
});
