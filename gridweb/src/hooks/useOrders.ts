import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';

export const useOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Query top-level orders collection filtered by userId
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          orderId: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return { orders, loading, error };
};

export const useOrder = (orderId: string) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !orderId) {
      setLoading(false);
      return;
    }

    // Reset loading when user/orderId changes and we need to fetch
    setLoading(true);
    setOrder(null);

    // Query top-level orders collection by orderId
    const orderRef = doc(db, 'orders', orderId);

    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Verify the order belongs to the current user
          if (data.userId === user.uid) {
            setOrder({
              orderId: snapshot.id,
              ...data,
            } as Order);
          } else {
            setOrder(null);
          }
        } else {
          setOrder(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching order:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, orderId]);

  return { order, loading, error };
};
