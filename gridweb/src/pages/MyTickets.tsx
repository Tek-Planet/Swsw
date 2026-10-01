import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Calendar, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const MyTickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orders, loading } = useOrders();

  useEffect(() => {
    if (!user) {
      localStorage.setItem('grid_return_url', '/my-tickets');
      navigate('/auth');
    }
  }, [user, navigate]);

  const paidOrders = orders.filter(order => order.status === 'paid');

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number, currency: string) => {
    // Fallback to USD if currency is not provided
    const validCurrency = currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      <div className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              My Tickets
            </h1>
            <p className="text-muted-foreground mb-8">
              Your purchased tickets and orders
            </p>

            {loading ? (
              <div className="py-20">
                <LoadingSpinner size="lg" text="Loading your tickets..." />
              </div>
            ) : paidOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 rounded-2xl bg-card border border-border text-center"
              >
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-display font-bold text-foreground mb-2">
                  No Tickets Yet
                </h2>
                <p className="text-muted-foreground mb-6">
                  You haven't purchased any tickets yet. Check out our upcoming events!
                </p>
                <Link to="/">
                  <Button variant="gradient">Browse Events</Button>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {paidOrders.map((order, index) => (
                  <motion.div
                    key={order.orderId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/my-tickets/${order.orderId}`}
                      className="block p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                              Confirmed
                            </span>
                            <span className="text-xs font-mono text-muted-foreground" title={order.orderId}>
                              #{order.orderId.length > 12 ? order.orderId.slice(-8).toUpperCase() : order.orderId}
                            </span>
                          </div>
                          <h3 className="text-lg font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors truncate">
                            {order.eventTitle || `Event Order`}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              {formatDate(order.createdAt)}
                            </span>
                            <span>
                              {order.items.reduce((a, b) => a + b.quantity, 0)} tickets
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-display font-bold text-gradient">
                            {formatPrice(order.subtotal, order.currency)}
                          </p>
                          <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto mt-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
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
};

export default MyTickets;
