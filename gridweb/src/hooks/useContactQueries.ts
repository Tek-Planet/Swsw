import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, updateDoc, doc, orderBy, query,
  Timestamp, where, onSnapshot, getDoc, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

// Helper: Send an in-app notification to a user
const sendTicketNotification = async (
  recipientUserId: string,
  title: string,
  message: string,
  ticketId: string,
) => {
  try {
    await addDoc(collection(db, 'notifications', recipientUserId, 'user_notifications'), {
      title,
      message,
      timestamp: serverTimestamp(),
      read: false,
      link: `/support/tickets`,
      icon: 'ticket',
    });
  } catch (error) {
    console.error('Error sending ticket notification:', error);
  }
};

// Helper: Notify admins about a ticket update
const notifyAdmins = async (title: string, message: string, ticketId: string) => {
  try {
    const adminsSnapshot = await getDocs(collection(db, 'user_roles'));
    const adminIds = adminsSnapshot.docs
      .filter(d => d.data().role === 'admin')
      .map(d => d.data().userId || d.id);
    
    await Promise.all(
      adminIds.map(adminId => sendTicketNotification(adminId, title, message, ticketId))
    );
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'admin';
  message: string;
  attachments?: TicketAttachment[];
  createdAt: Date;
}

export interface TicketAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ContactQuery {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  resolvedBy?: 'client' | 'admin';
  createdAt: Date;
  updatedAt?: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
}

// Upload file to Firebase Storage for ticket attachments
const uploadTicketFile = async (
  file: File,
  ticketId: string,
  onProgress?: (progress: number) => void
): Promise<TicketAttachment> => {
  const storageRef = ref(storage, `support_tickets/${ticketId}/${Date.now()}_${file.name}`);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          name: file.name,
          url,
          type: file.type,
          size: file.size,
        });
      }
    );
  });
};

// Hook: Submit a new support ticket (for clients)
export const useSubmitContactQuery = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitQuery = async (data: {
    subject: string;
    message: string;
    files?: File[];
  }) => {
    if (!user) return null;
    setIsSubmitting(true);
    try {
      // Create the ticket document
      const ticketRef = await addDoc(collection(db, 'contact_queries'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userEmail: user.email || '',
        subject: data.subject.trim(),
        status: 'open',
        lastMessage: data.message.trim(),
        lastMessageAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      // Upload attachments if any
      let attachments: TicketAttachment[] = [];
      if (data.files && data.files.length > 0) {
        attachments = await Promise.all(
          data.files.map(file => uploadTicketFile(file, ticketRef.id))
        );
      }

      // Add the initial message
      await addDoc(collection(db, 'contact_queries', ticketRef.id, 'messages'), {
        ticketId: ticketRef.id,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'User',
        senderRole: 'client',
        message: data.message.trim(),
        attachments: attachments.length > 0 ? attachments : [],
        createdAt: Timestamp.now(),
      });

      // Notify admins about new ticket
      await notifyAdmins(
        'New Support Ticket',
        `${user.displayName || user.email} created: "${data.subject.trim()}"`,
        ticketRef.id
      );

      return ticketRef.id;
    } catch (error) {
      console.error('Error submitting ticket:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitQuery, isSubmitting };
};

// Hook: Fetch user's own tickets (for client "My Support Tickets" page)
export const useMyTickets = () => {
  const [tickets, setTickets] = useState<ContactQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'contact_queries'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          userId: raw.userId,
          userName: raw.userName,
          userEmail: raw.userEmail,
          subject: raw.subject || raw.message?.substring(0, 50) || 'No subject',
          status: raw.status || 'open',
          resolvedBy: raw.resolvedBy,
          createdAt: raw.createdAt?.toDate?.() || new Date(),
          updatedAt: raw.updatedAt?.toDate?.(),
          lastMessage: raw.lastMessage,
          lastMessageAt: raw.lastMessageAt?.toDate?.(),
        } as ContactQuery;
      });
      setTickets(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching my tickets:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { tickets, loading };
};

// Hook: Fetch all tickets (for admin)
export const useContactQueries = (statusFilter?: string) => {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    try {
      const constraints: any[] = [orderBy('createdAt', 'desc')];
      if (statusFilter) {
        constraints.unshift(where('status', '==', statusFilter));
      }
      const q = query(collection(db, 'contact_queries'), ...constraints);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          userId: raw.userId,
          userName: raw.userName || raw.name || 'Unknown',
          userEmail: raw.userEmail || raw.email || '',
          subject: raw.subject || raw.message?.substring(0, 50) || 'No subject',
          status: raw.status || 'open',
          resolvedBy: raw.resolvedBy,
          createdAt: raw.createdAt?.toDate?.() || new Date(),
          updatedAt: raw.updatedAt?.toDate?.(),
          lastMessage: raw.lastMessage,
          lastMessageAt: raw.lastMessageAt?.toDate?.(),
        } as ContactQuery;
      });
      setQueries(data);
    } catch (error) {
      console.error('Error fetching contact queries:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const updateQuery = async (id: string, updates: { status?: string; resolvedBy?: string }) => {
    try {
      await updateDoc(doc(db, 'contact_queries', id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      await fetchQueries();
      return true;
    } catch (error) {
      console.error('Error updating query:', error);
      return false;
    }
  };

  return { queries, loading, refetch: fetchQueries, updateQuery };
};

// Hook: Fetch messages for a specific ticket (real-time)
export const useTicketMessages = (ticketId: string | null) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'contact_queries', ticketId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ticketId: raw.ticketId,
          senderId: raw.senderId,
          senderName: raw.senderName,
          senderRole: raw.senderRole,
          message: raw.message,
          attachments: raw.attachments || [],
          createdAt: raw.createdAt?.toDate?.() || new Date(),
        } as TicketMessage;
      });
      setMessages(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ticketId]);

  return { messages, loading };
};

// Hook: Send a reply to a ticket
export const useSendTicketReply = () => {
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();

  const sendReply = async (data: {
    ticketId: string;
    message: string;
    senderRole: 'client' | 'admin';
    files?: File[];
  }) => {
    if (!user) return false;
    setIsSending(true);
    try {
      // Upload attachments
      let attachments: TicketAttachment[] = [];
      if (data.files && data.files.length > 0) {
        attachments = await Promise.all(
          data.files.map(file => uploadTicketFile(file, data.ticketId))
        );
      }

      // Add the message
      await addDoc(collection(db, 'contact_queries', data.ticketId, 'messages'), {
        ticketId: data.ticketId,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'User',
        senderRole: data.senderRole,
        message: data.message.trim(),
        attachments: attachments.length > 0 ? attachments : [],
        createdAt: Timestamp.now(),
      });

      // Update the ticket's last message
      const ticketUpdates: Record<string, any> = {
        lastMessage: data.message.trim(),
        lastMessageAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // If ticket was resolved and someone replies, reopen it
      const ticketDoc = await getDoc(doc(db, 'contact_queries', data.ticketId));
      if (ticketDoc.exists() && ticketDoc.data().status === 'resolved') {
        ticketUpdates.status = 'in_progress';
      } else if (ticketDoc.exists() && ticketDoc.data().status === 'open' && data.senderRole === 'admin') {
        ticketUpdates.status = 'in_progress';
      }

      await updateDoc(doc(db, 'contact_queries', data.ticketId), ticketUpdates);

      // Send notification to the other party
      if (data.senderRole === 'admin') {
        // Notify the client
        const ticketData = ticketDoc.data();
        if (ticketData?.userId) {
          await sendTicketNotification(
            ticketData.userId,
            'New Reply on Your Ticket',
            `Admin replied to "${ticketData.subject || 'your ticket'}"`,
            data.ticketId
          );
        }
      } else {
        // Notify admins
        const ticketData = ticketDoc.exists() ? ticketDoc.data() : null;
        await notifyAdmins(
          'New Ticket Reply',
          `${user.displayName || user.email} replied to "${ticketData?.subject || 'a ticket'}"`,
          data.ticketId
        );
      }

      return true;
    } catch (error) {
      console.error('Error sending reply:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return { sendReply, isSending };
};

// Hook: Mark ticket as resolved
export const useResolveTicket = () => {
  const [isResolving, setIsResolving] = useState(false);

  const resolveTicket = async (ticketId: string, resolvedBy: 'client' | 'admin') => {
    setIsResolving(true);
    try {
      await updateDoc(doc(db, 'contact_queries', ticketId), {
        status: 'resolved',
        resolvedBy,
        updatedAt: Timestamp.now(),
      });

      // Notify the other party
      const ticketDoc = await getDoc(doc(db, 'contact_queries', ticketId));
      const ticketData = ticketDoc.data();
      if (resolvedBy === 'admin' && ticketData?.userId) {
        await sendTicketNotification(
          ticketData.userId,
          'Ticket Resolved',
          `Your ticket "${ticketData.subject || ''}" has been resolved`,
          ticketId
        );
      } else if (resolvedBy === 'client') {
        await notifyAdmins(
          'Ticket Resolved by Client',
          `"${ticketData?.subject || 'A ticket'}" was marked resolved`,
          ticketId
        );
      }

      return true;
    } catch (error) {
      console.error('Error resolving ticket:', error);
      return false;
    } finally {
      setIsResolving(false);
    }
  };

  const reopenTicket = async (ticketId: string) => {
    setIsResolving(true);
    try {
      await updateDoc(doc(db, 'contact_queries', ticketId), {
        status: 'open',
        resolvedBy: null,
        updatedAt: Timestamp.now(),
      });

      // Notify admins about reopened ticket
      const ticketDoc = await getDoc(doc(db, 'contact_queries', ticketId));
      const ticketData = ticketDoc.data();
      await notifyAdmins(
        'Ticket Reopened',
        `"${ticketData?.subject || 'A ticket'}" was reopened`,
        ticketId
      );

      return true;
    } catch (error) {
      console.error('Error reopening ticket:', error);
      return false;
    } finally {
      setIsResolving(false);
    }
  };

  return { resolveTicket, reopenTicket, isResolving };
};
