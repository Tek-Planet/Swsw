
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { TableContactDetails } from '../types/event';

interface TableContactFormProps {
  orderId: string;
  onSubmitSuccess: () => void;
}

const TableContactForm: React.FC<TableContactFormProps> = ({ orderId, onSubmitSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const functions = getFunctions();

  const isFormValid = () => {
    return fullName.trim() !== '' && email.trim() !== '' && phone.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Missing Information', 'Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateOrderContactDetails = httpsCallable(functions, 'updateOrderContactDetails');
      await updateOrderContactDetails({ 
        orderId, 
        contactDetails: { fullName, email, phone, notes } 
      });
      
      Alert.alert('Success', 'Your table details have been saved.');
      onSubmitSuccess();

    } catch (error) {
      console.error("Error updating contact details:", error);
      Alert.alert('Submission Failed', (error as Error).message || 'Could not save your details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formHeader}>Table Reservation Details</Text>
      <Text style={styles.formSubheader}>Please provide the contact information for your table booking.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        placeholderTextColor="#888"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address *"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number *"
        placeholderTextColor="#888"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes or Special Requests (Optional)"
        placeholderTextColor="#888"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity 
        style={[styles.submitButton, (!isFormValid() || isSubmitting) && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={!isFormValid() || isSubmitting}
      >
        {isSubmitting 
          ? <ActivityIndicator color="#fff" /> 
          : <Text style={styles.submitButtonText}>Confirm Booking Details</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    marginVertical: 20,
    width: '100%',
  },
  formHeader: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  formSubheader: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 12,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TableContactForm;
