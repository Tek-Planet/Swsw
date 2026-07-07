
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types/event';

interface CustomQuestion {
    id: string;
    label: string;
    placeholder?: string;
    required?: boolean;
}

interface EventApplicationFormProps {
    event: Event;
    onApplicationSubmitted: () => void;
}

const EventApplicationForm = ({ event, onApplicationSubmitted }: EventApplicationFormProps) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.displayName || '',
        email: user?.email || '',
        phone: user?.phoneNumber || '',
    });
    const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const customQuestions: CustomQuestion[] = event.customQuestions || [];

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.displayName || '',
                email: user.email || '',
                phone: user.phoneNumber || '',
            });
        }
    }, [user]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Full name is required.";
        if (!formData.email.trim()) newErrors.email = "Email is required.";
        if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid.";
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
        
        customQuestions.forEach(q => {
            if (q.required && !customAnswers[q.id]?.trim()) {
                newErrors[q.id] = `${q.label} is required.`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert("Authentication Error", "You must be logged in to apply.");
            return;
        }

        if (!validateForm()) {
            Alert.alert("Missing Information", "Please fill out all required fields correctly.");
            return;
        }

        setIsSubmitting(true);
        try {
            const applicationRef = doc(db, 'events', event.id, 'applications', user.uid);
            await setDoc(applicationRef, {
                userId: user.uid,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                answers: customAnswers,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }, { merge: true });
            
            Alert.alert(
                "Application Submitted", 
                "Your application has been received. You will be notified once it's reviewed."
            );
            onApplicationSubmitted();
        } catch (error) {
            console.error("Failed to submit application:", error);
            Alert.alert("Submission Failed", "An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Apply to Join</Text>
            <Text style={styles.subtitle}>This is an invite-only event. Please fill out the form below to request a spot.</Text>
            
            <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholder="Full Name *"
                value={formData.name}
                onChangeText={text => setFormData(p => ({ ...p, name: text }))}
                placeholderTextColor="#888"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Email *"
                value={formData.email}
                onChangeText={text => setFormData(p => ({ ...p, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
                editable={!user?.email} 
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            
            <TextInput
                style={[styles.input, errors.phone ? styles.inputError : null]}
                placeholder="Phone Number *"
                value={formData.phone}
                onChangeText={text => setFormData(p => ({ ...p, phone: text }))}
                keyboardType="phone-pad"
                placeholderTextColor="#888"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            {customQuestions.map(q => (
                <View key={q.id}>
                    <Text style={styles.questionLabel}>{q.label} {q.required ? '*' : ''}</Text>
                    <TextInput
                        style={[styles.input, errors[q.id] ? styles.inputError : null]}
                        placeholder={q.placeholder || 'Your answer'}
                        value={customAnswers[q.id] || ''}
                        onChangeText={text => setCustomAnswers(p => ({ ...p, [q.id]: text }))}
                        placeholderTextColor="#888"
                    />
                    {errors[q.id] && <Text style={styles.errorText}>{errors[q.id]}</Text>}
                </View>
            ))}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting 
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.submitButtonText}>Submit Application</Text>
                }
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#1a1a1a', borderRadius: 10, marginHorizontal: 15, marginVertical: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#aaa', marginBottom: 20, lineHeight: 20 },
    input: { backgroundColor: '#2c2c2e', color: '#fff', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
    inputError: { borderColor: '#e53e3e', borderWidth: 1 },
    errorText: { color: '#e53e3e', fontSize: 12, marginBottom: 10, marginTop: -8 },
    questionLabel: { color: '#fff', fontSize: 16, marginBottom: 10, fontWeight: '500' },
    submitButton: { backgroundColor: '#4a90e2', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default EventApplicationForm;
