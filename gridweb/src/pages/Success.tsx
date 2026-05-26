import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Ticket, Loader2, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useOrder } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import TableContactForm from '@/components/TableContactForm';

const Success = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const { user, loading: authLoading } = useAuth();
  const { order, loading: orderLoading } = useOrder(orderId);
  const [isPaid, setIsPaid] = useState(false);
  const [contactFormCompleted, setContactFormCompleted] = useState(false);

  // Combined loading state - wait for both auth and order
  const loading = authLoading || orderLoading;

  useEffect(() => {
    if (order?.status === 'paid') {
      setIsPaid(true);
      // Check if contact details already exist
      if (order.tableContactDetails) {
        setContactFormCompleted(true);
      }
    }
  }, [order]);

  const formatPrice = (price: number) => {
    const orderCurrency = order?.currency || 'INR';
    const locale = orderCurrency === 'USD' ? 'en-US' : orderCurrency === 'HKD' ? 'en-HK' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: orderCurrency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Check if order contains a table
  const hasTable = order?.items?.some(item => item.type === 'table');
  const showContactForm = isPaid && hasTable && !contactFormCompleted && user;

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
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-6"
                >
                  <Loader2 className="w-16 h-16 text-primary" />
                </motion.div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Loading Order...
                </h1>
                <p className="text-muted-foreground mb-6">
                  Please wait while we fetch your order details.
                </p>
              </>
            ) : !order ? (
              <>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Order Not Found
                </h1>
                <p className="text-muted-foreground mb-6">
                  We couldn't find this order. It may still be processing or you may need to log in.
                </p>
                <div className="space-y-3">
                  <Link to="/my-tickets" className="block">
                    <Button variant="gradient" className="w-full">
                      View My Tickets
                    </Button>
                  </Link>
                  <Link to="/" className="block">
                    <Button variant="outline" className="w-full">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            ) : order.status === 'pending' ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-6"
                >
                  <Loader2 className="w-16 h-16 text-primary" />
                </motion.div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Processing Payment...
                </h1>
                <p className="text-muted-foreground mb-6">
                  Please wait while we confirm your payment.
                </p>
              </>
            ) : isPaid ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </motion.div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Payment Successful!
                </h1>
                {hasTable ? (
                  <p className="text-muted-foreground mb-6">
                    Please note your table is not booked yet – our team will be in touch to finalize details. Please share contact details below and you will hear from us soon!
                  </p>
                ) : (
                  <p className="text-muted-foreground mb-6">
                    Thank you for your purchase. Your tickets have been confirmed.
                  </p>
                )}

                {order && (
                <div className="p-4 rounded-xl bg-muted mb-6 text-left">
                    <p className="text-sm text-muted-foreground mb-2">Order ID</p>
                    <p className="font-mono text-sm text-foreground mb-4">{order.orderId}</p>
                    
                    <p className="text-sm text-muted-foreground mb-2">Total Paid</p>
                    <p className="text-2xl font-display font-bold text-gradient">
                      {formatPrice(order.total ?? order.subtotal)}
                    </p>

                    {order.discount && order.discount > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice((order.total ?? order.subtotal) + order.discount)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-medium whitespace-nowrap">
                          {order.promoCode} applied
                        </span>
                      </div>
                    )}

                    {hasTable && (
                      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-primary">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Includes table reservation</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Table Contact Form */}
                {showContactForm && order && (
                  <div className="mb-6 text-left">
                    <TableContactForm
                      orderId={order.orderId}
                      onComplete={() => setContactFormCompleted(true)}
                    />
                  </div>
                )}

                {/* Contact form completed message */}
                {hasTable && contactFormCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-left"
                  >
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Contact details saved!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our team will reach out to you for table arrangements.
                    </p>
                  </motion.div>
                )}

                <div className="space-y-3">
                  <Link to="/my-tickets" className="block">
                    <Button variant="hero" className="w-full gap-2">
                      <Ticket className="w-4 h-4" />
                      View My Tickets
                    </Button>
                  </Link>
                  <Link to="/" className="block">
                    <Button variant="outline" className="w-full">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Order Status Unknown
                </h1>
                <p className="text-muted-foreground mb-6">
                  We couldn't verify your payment status. Please check your tickets or contact support.
                </p>
                <div className="space-y-3">
                  <Link to="/my-tickets" className="block">
                    <Button variant="gradient" className="w-full">
                      View My Tickets
                    </Button>
                  </Link>
                  <Link to="/" className="block">
                    <Button variant="outline" className="w-full">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Success;
