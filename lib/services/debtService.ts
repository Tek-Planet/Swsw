
import { Expense } from '@/types/expense';

export interface Debt {
  from: string;
  to: string;
  amount: number;
}

export const calculateDebts = (expenses: Expense[], members: string[]): Debt[] => {
  if (!expenses || expenses.length === 0) {
    return [];
  }

  const balances: { [userId: string]: number } = {};

  // Initialize balances for all members to 0
  members.forEach(memberId => {
    balances[memberId] = 0;
  });

  // Calculate how much each person is owed or owes
  expenses.forEach(expense => {
    const { amount, paidById, participants, splitType } = expense;

    // The person who paid is owed the full amount initially
    balances[paidById] = (balances[paidById] || 0) + amount;

    if (splitType === 'equal') {
      // This assumes participants in an equal split are all members involved in that expense
      const share = amount / participants.length;
      participants.forEach(participant => {
        balances[participant.userId] = (balances[participant.userId] || 0) - share;
      });
    } else { // 'unequal' or other types
      participants.forEach(participant => {
        balances[participant.userId] = (balances[participant.userId] || 0) - participant.amount;
      });
    }
  });

  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  Object.keys(balances).forEach(userId => {
    const balance = balances[userId];
    // Use a small epsilon to handle floating point inaccuracies
    if (balance < -0.01) {
      debtors.push({ userId, amount: -balance });
    } else if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    }
  });

  const debts: Debt[] = [];

  // Simplify debts to find the minimum number of transactions
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountToSettle = Math.min(debtor.amount, creditor.amount);

    if (amountToSettle > 0) {
        debts.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: amountToSettle,
        });
    }

    debtor.amount -= amountToSettle;
    creditor.amount -= amountToSettle;

    if (debtor.amount < 0.01) {
      debtorIndex++;
    }
    if (creditor.amount < 0.01) {
      creditorIndex++;
    }
  }

  return debts;
};
