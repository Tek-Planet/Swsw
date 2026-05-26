import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, documentId, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';

export function MyEventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('grid_return_url', '/my-events');
      navigate('/auth');
      return;
    }

    const fetchMyEvents = async () => {
      try {
        const ordersCollection = collection(db, 'orders');
        const ordersQuery = query(ordersCollection, where('userId', '==', user.uid), where('status', '==', 'paid'));
        const ordersSnapshot = await getDocs(ordersQuery);

        if (ordersSnapshot.empty) {
          setEvents([]);
          setLoading(false);
          return;
        }

        const eventIds = [...new Set(ordersSnapshot.docs.map(doc => doc.data().eventId))];

        if (eventIds.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }

        const eventsCollection = collection(db, 'events');
        const eventsQuery = query(eventsCollection, where(documentId(), 'in', eventIds));
        const eventsSnapshot = await getDocs(eventsQuery);

        const eventsList = eventsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startTime: (data.startTime as Timestamp).toDate(),
          } as Event;
        });

        eventsList.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

        setEvents(eventsList);
      } catch (error) {
        console.error('Error fetching my events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [user, navigate]);

  if (loading) {
    return (
        <div className="min-h-screen gradient-hero">
            <Navbar />
            <div className="py-20">
                <LoadingSpinner size="lg" text="Loading your events..." />
            </div>
        </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Events</h1>
            <p className="text-muted-foreground mb-8">Events you have tickets for</p>

            {events.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 rounded-2xl bg-card border border-border text-center"
              >
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-display font-bold text-foreground mb-2">No Events Yet</h2>
                <p className="text-muted-foreground mb-6">You haven't purchased any tickets yet. Check out our upcoming events!</p>
                <Link to="/">
                  <Button variant="gradient">Browse Events</Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/my-events/${event.id}`}>
                      <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-300 bg-card border border-border hover:border-primary/30">
                          <div className="relative">
                              <img src={event.coverImageUrl} alt={event.title} className="w-full h-48 object-cover" />
                              <Badge className={`absolute top-2 right-2 ${event.startTime < new Date() ? 'bg-gray-500' : 'bg-primary'}`}>
                                  {event.startTime < new Date() ? 'Past' : 'Upcoming'}
                              </Badge>
                          </div>
                          <CardContent className="p-4 flex flex-col flex-grow">
                              <h2 className="text-lg font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors truncate">{event.title}</h2>
                              <p className="text-sm text-muted-foreground mb-4 flex-grow">{event.startTime.toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                })}</p>
                              {event.location && <p className="text-xs text-muted-foreground">{event.location.city}</p>}
                          </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
