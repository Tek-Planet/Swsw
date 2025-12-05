
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import ExpenseSummary from './ExpenseSummary';
import ExpenseCard from './ExpenseCard';
import AddExpenseModal from './AddExpenseModal';

interface GroupExpensesProps {
  groupId: string;
}

const expenses = [
  { id: '1', description: 'Groceries', amount: 50, paidBy: 'Alice', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: '2', description: 'Movie Tickets', amount: 30, paidBy: 'Bob', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '3', description: 'Dinner', amount: 80, paidBy: 'Alice', avatar: 'https://i.pravatar.cc/150?img=4' },
];

const GroupExpenses: React.FC<GroupExpensesProps> = ({ groupId }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const renderExpense = ({ item }: any) => <ExpenseCard expense={item} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shared Expenses</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <ExpenseSummary />
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
      />
      <AddExpenseModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    marginHorizontal:20,
    marginBottom:20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    color: '#6c63ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GroupExpenses;
