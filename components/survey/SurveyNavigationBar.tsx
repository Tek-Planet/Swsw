
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface SurveyNavigationBarProps {
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  isLast?: boolean;
  isSubmitting?: boolean;
}

const SurveyNavigationBar: React.FC<SurveyNavigationBarProps> = ({ onNext, onBack, isNextDisabled, isLast, isSubmitting }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton, (isNextDisabled || isSubmitting) && styles.disabledButton]}
        onPress={onNext}
        disabled={isNextDisabled || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isLast ? 'Submit' : 'Next'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
   
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 50,
    alignSelf:"center"
  },
  button: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 0.48,
  },
  primaryButton: {
    backgroundColor: '#6c63ff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SurveyNavigationBar;
