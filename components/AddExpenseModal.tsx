
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { createExpense } from '@/lib/services/expenseService';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ visible, onClose, groupId }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
  
    const handleAddExpense = async () => {
      if (!description || !amount) {
        alert('Please fill in all fields');
        return;
      }

      const expenseData = {
        description,
        amount: parseFloat(amount),
        currency: 'USD',
        paidById: 'user1', // Hardcoded for now
        splitType: 'equal' as 'equal',
        participants: [{ userId: 'user1', amount: parseFloat(amount) / 2 }, { userId: 'user2', amount: parseFloat(amount) / 2 }], // Hardcoded for now
      };

      try {
        await createExpense(groupId, expenseData);
        onClose();
      } catch (error) {
        console.error('Error creating expense:', error);
        alert('Failed to create expense');
      }
    };
  
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.centeredView}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Add New Expense</Text>
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#aaa"
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.buttonClose]}
                    onPress={onClose}
                >
                    <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.buttonAdd]}
                    onPress={handleAddExpense}
                    >
                    <Text style={styles.textStyle}>Add</Text>
                </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };
  
  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '80%',
        backgroundColor: '#2a2a2a',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      modalText: {
        marginBottom: 15,
        textAlign: 'center',
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
      },
      input: {
        width: '100%',
        backgroundColor: '#3a3a3a',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        color: 'white',
      },
      buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
      },
      button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        flex: 1,
        marginHorizontal: 5
      },
      buttonClose: {
        backgroundColor: '#ff6347',
      },
      buttonAdd: {
        backgroundColor: '#6c63ff',
      },
      textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
      },
});
  
export default AddExpenseModal;
