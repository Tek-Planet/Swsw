
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import ExpenseSummary from './ExpenseSummary';
import ExpenseCard from './ExpenseCard';
import AddExpenseModal from './AddExpenseModal';
import DebtCard from './DebtCard';
import { getExpensesForGroup, createExpense } from '@/lib/services/expenseService';
import { calculateDebts, calculateOwedTotals, Debt, OwedTotals } from '@/lib/services/debtService';
import { Expense } from '@/types/expense';

interface GroupExpensesProps {
  groupId: string;
}

// Hardcoded members and current user for now
const groupMembers = ['user1', 'user2'];
const currentUserId = 'user1'; // Replace with dynamic user ID from auth

const GroupExpenses: React.FC<GroupExpensesProps> = ({ groupId }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [owedTotals, setOwedTotals] = useState<OwedTotals>({ owedByYou: 0, owedToYou: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getExpensesForGroup(groupId, (newExpenses) => {
      setExpenses(newExpenses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    if (expenses.length > 0) {
      const calculatedDebts = calculateDebts(expenses, groupMembers);
      setDebts(calculatedDebts);
    } else {
      setDebts([]);
    }
  }, [expenses]);

  useEffect(() => {
    if (debts.length > 0) {
      const totals = calculateOwedTotals(debts, currentUserId);
      setOwedTotals(totals);
    } else {
      setOwedTotals({ owedByYou: 0, owedToYou: 0 });
    }
  }, [debts]);

  const handleSettleDebt = async (debt: Debt) => {
    try {
      const settlementExpense = {
        description: `Settled debt: ${debt.from} to ${debt.to}`,
        amount: debt.amount,
        currency: 'USD',
        paidById: debt.from,
        splitType: 'unequal' as 'unequal',
        participants: [{ userId: debt.to, amount: debt.amount }],
      };

      await createExpense(groupId, settlementExpense);
    } catch (error) {
      console.error('Error settling debt:', error);
      Alert.alert('Error', 'Failed to settle debt. Please try again.');
    }
  };

  const renderExpense = ({ item }: { item: Expense }) => <ExpenseCard expense={item} />;
  const renderDebt = ({ item }: { item: Debt }) => <DebtCard debt={item} onSettle={handleSettleDebt} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shared Expenses</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <ExpenseSummary owedByYou={owedTotals.owedByYou} owedToYou={owedTotals.owedToYou} />
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : expenses.length === 0 ? (
        <Text style={styles.noItemsText}>No expenses yet. Be the first to add one!</Text>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Debts</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : debts.length === 0 ? (
        <Text style={styles.noItemsText}>All settled up!</Text>
      ) : (
        <FlatList
          data={debts}
          renderItem={renderDebt}
          keyExtractor={(item, index) => `${item.from}-${item.to}-${index}`}
          style={styles.list}
        />
      )}

      <AddExpenseModal groupId={groupId} visible={modalVisible} onClose={() => setModalVisible(false)} />
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
    marginTop: 10,
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
  noItemsText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  list: {
    maxHeight: 200,
  }
});

export default GroupExpenses;
