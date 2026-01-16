
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Expense } from '@/types/expense';

export const createExpense = async (groupId: string, expenseData: Omit<Expense, 'id' | 'createdAt' | 'groupId'>): Promise<string> => {
  try {
    const expensesCollectionRef = collection(db, 'groups', groupId, 'expenses');
    const newExpenseDocRef = await addDoc(expensesCollectionRef, {
      ...expenseData,
      groupId,
      createdAt: serverTimestamp(),
    });
    return newExpenseDocRef.id;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw new Error('Failed to create expense');
  }
};

export const getExpensesForGroup = (groupId: string, onUpdate: (expenses: Expense[]) => void): () => void => {
  const expensesCollectionRef = collection(db, 'groups', groupId, 'expenses');
  const q = query(expensesCollectionRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const expenses: Expense[] = [];
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() } as Expense);
    });
    onUpdate(expenses);
  });

  return unsubscribe;
};

export const updateExpense = async (groupId: string, expenseId: string, expenseData: Partial<Expense>): Promise<void> => {
  try {
    const expenseDocRef = doc(db, 'groups', groupId, 'expenses', expenseId);
    await updateDoc(expenseDocRef, expenseData);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw new Error('Failed to update expense');
  }
};

export const deleteExpense = async (groupId: string, expenseId: string): Promise<void> => {
  try {
    const expenseDocRef = doc(db, 'groups', groupId, 'expenses', expenseId);
    await deleteDoc(expenseDocRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense');
  }
};

export const addRepayment = async (groupId: string, fromUserId: string, toUserId: string, amount: number): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Create a new expense to represent the repayment
    const repaymentExpense: Omit<Expense, 'id' | 'createdAt' | 'groupId'> = {
      description: 'Repayment',
      amount,
      currency: 'USD', // Or get from group settings
      paidById: fromUserId,
      splitType: 'unequal',
      participants: [{ userId: toUserId, amount }],
    };

    const expensesCollectionRef = collection(db, 'groups', groupId, 'expenses');
    const newExpenseDocRef = doc(expensesCollectionRef); // Create a new doc with a generated id

    batch.set(newExpenseDocRef, {
      ...repaymentExpense,
      groupId,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    console.error('Error adding repayment:', error);
    throw new Error('Failed to add repayment');
  }
};
