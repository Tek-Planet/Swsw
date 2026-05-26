import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const cancelOrder = httpsCallable(functions, 'cancelOrder');

const Cancel = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const eventId = localStorage.getItem('grid_last_event') || 'grid-launch-party';

  useEffect(() => {
    if (orderId) {
      const performCancellation = async () => {
        try {
          console.log(`Attempting to cancel order: ${orderId}`);
          await cancelOrder({ orderId });
          console.log('Cancellation successful for order:', orderId);
        } catch (error) {
          console.error("Error canceling order:", error);
        }
      };
      performCancellation();
    }
  }, [orderId]);

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      <div className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl bg-card border border-border text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="w-20 h-20 mx-auto mb-6 bg-destructive/20 rounded-full flex items-center justify-center"
            >
              <XCircle className="w-10 h-10 text-destructive" />
            </motion.div>

            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Payment Cancelled
            </h1>
            <p className="text-muted-foreground mb-6">
              Your payment was cancelled. No charges have been made to your account.
            </p>

            {orderId && (
              <p className="text-xs text-muted-foreground mb-6">
                Reference: {orderId}
              </p>
            )}

            <div className="space-y-3">
              <Link to={`/events/${eventId}`} className="block">
                <Button variant="hero" className="w-full gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              </Link>
              <Link to="/" className="block">
                <Button variant="outline" className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Cancel;
