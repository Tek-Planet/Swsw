
import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import { Expense } from '@/types/expense';
import { UserProfile } from '@/types/user';
import ExpenseCard from './ExpenseCard';

interface ActivityFeedProps {
  expenses: Expense[];
  userProfiles: Map<string, UserProfile>;
  currentUserId: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ expenses, userProfiles, currentUserId }) => {
  if (expenses.length === 0) {
    return <Text style={styles.noItemsText}>No expenses yet. Be the first to add one!</Text>;
  }

  const renderExpense = ({ item }: { item: Expense }) => {
    const paidBy = item.paidById === currentUserId ? 'You' : userProfiles.get(item.paidById)?.displayName || item.paidById;
    return <ExpenseCard expense={item} paidBy={paidBy} />;
  };

  return (
    <FlatList
      data={expenses}
      renderItem={renderExpense}
      keyExtractor={(item) => item.id}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    maxHeight: 200,
  },
  noItemsText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});

export default ActivityFeed;
