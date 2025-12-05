import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

type NavigationProps = StackNavigationProp<RootStackParamList, 'EnhanceGridSurveyScreen'>;

const EnhanceGridSurveyScreen = () => {
    const navigation = useNavigation<NavigationProps>();

    useEffect(() => {
        navigation.replace('SurveyQuestionScreen', { questionId: 1 });
    }, [navigation]);

    return null;
};

export default EnhanceGridSurveyScreen;
