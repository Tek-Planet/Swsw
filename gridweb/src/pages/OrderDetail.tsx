
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, CheckCircle, User, Mail, Phone, Share2, Film, Armchair } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useOrder } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { order, loading } = useOrder(orderId || '');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPrice = (price: number, currency: string = 'INR') => {
    const locale = currency === 'USD' ? 'en-US' : currency === 'HKD' ? 'en-HK' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isMovieOrder = order?.orderType === 'movie';

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="Loading order..." />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">Order not found</p>
          <Link to="/my-tickets">
            <Button variant="outline">Back to My Tickets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      <div className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <Link
            to="/my-tickets"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Tickets
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Confirmed
                    </span>
                  </div>
                  <h1 className="text-2xl font-display font-bold text-foreground">
                    Order Confirmation
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono text-foreground" title={order.orderId}>
                    {order.orderId.length > 12 ? `${order.orderId.slice(-8).toUpperCase()}` : order.orderId}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Date</p>
                  <p className="text-foreground">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-4">
                {isMovieOrder ? (
                  <Film className="w-5 h-5 text-primary" />
                ) : (
                  <Calendar className="w-5 h-5 text-primary" />
                )}
                 <h2 className="text-lg font-display font-semibold text-foreground">
                  Event Details
                </h2>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {order.eventTitle || 'Grid Launch Event'}
              </h3>
              {order.eventDate && (
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{formatDate(order.eventDate)}, {formatTime(order.eventDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Bengaluru</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tickets & QR Codes */}
            {isMovieOrder ? (
                <div className="p-6 rounded-2xl bg-card border border-border">
                    <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                    Your Seats ({order.items.length})
                    </h2>
                    <div className="space-y-4">
                    {order.items.map((item: any, index: number) => (
                        <div key={index} className="p-4 rounded-xl bg-muted">
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <div className="flex-1">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                    <Armchair className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-foreground">
                                    {item.tierName || `Seat ${index + 1}`}
                                    </span>
                                </div>
                                {order.attendees && order.attendees[index] && (
                                    <div className="grid grid-cols-1 gap-1 text-sm text-muted-foreground sm:ml-6">
                                        <div className="flex items-center justify-center sm:justify-start gap-2">
                                            <User className="h-3 w-3" />
                                            <span>{order.attendees[index].name}</span>
                                        </div>
                                    </div>
                                )}
                                </div>

                                <div className="p-2 bg-white rounded-lg mt-4 sm:mt-0">
                                <QRCodeSVG
                                    value={`${order.orderId}-${index}`}
                                    size={128}
                                    level="H"
                                />
                                </div>
                            </div>
                            <p className="text-xs text-center text-muted-foreground mt-4">
                                Show this QR code for entry
                            </p>
                        </div>
                    ))}
                    </div>
                </div>
            ) : order.attendees && order.attendees.length > 0 && (
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                  Your Tickets ({order.attendees.length})
                </h2>
                <div className="space-y-4">
                  {order.attendees.map((attendee, index) => (
                    <div key={index} className="p-4 rounded-xl bg-muted">
                      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="flex-1">
                          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">
                              {attendee.name || `Attendee ${index + 1}`}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-1 text-sm text-muted-foreground sm:ml-6">
                            {attendee.email && (
                              <div className="flex items-center justify-center sm:justify-start gap-2">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{attendee.email}</span>
                              </div>
                            )}
                            {attendee.phone && (
                              <div className="flex items-center justify-center sm:justify-start gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{attendee.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-2 bg-white rounded-lg mt-4 sm:mt-0">
                          <QRCodeSVG
                            value={`${order.orderId}-${index}`}
                            size={128}
                            level="H"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-4">
                        Show this QR code for entry
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="space-y-3">
                {order.items.map((item: any, index) => {
                  const price = item.price ?? item.unitPrice ?? item.chargeAmount ?? 0;
                  const name = item.tierName ?? item.name ?? 'Unknown Item';
                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(price, order.currency)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-display font-bold text-foreground">
                        {formatPrice(price * item.quantity, order.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 mt-4 border-t border-border space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(order.subtotal, order.currency)}</span>
                </div>
                {order.processingFee !== undefined && order.processingFee > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="text-foreground">{formatPrice(order.processingFee, order.currency)}</span>
                  </div>
                )}
                {order.gstAmount !== undefined && order.gstAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST ({order.gstPercent || 0}%)</span>
                      <span className="text-foreground">{formatPrice(order.gstAmount, order.currency)}</span>
                    </div>
                )}
                {order.discount !== undefined && order.discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Discount {order.promoCode && `(${order.promoCode})`}</span>
                    <span className="text-green-500">-{formatPrice(order.discount, order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="text-2xl font-display font-bold text-gradient">
                    {formatPrice(order.total, order.currency)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Table Contact Details */}
            {order.tableContactDetails && (
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                  Table Booking Contact
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-primary" />
                    <span>{order.tableContactDetails.fullName}</span>
                  </div>
                  {order.tableContactDetails.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{order.tableContactDetails.email}</span>
                    </div>
                  )}
                  {order.tableContactDetails.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{order.tableContactDetails.phone}</span>
                    </div>
                  )}
                  {order.tableContactDetails.notes && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-foreground">{order.tableContactDetails.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  const eventTitle = order.eventTitle || 'an event';
                  const shareText = `I'm attending ${eventTitle}! 🎉`;
                  const shareUrl = window.location.href;

                  if (navigator.share) {
                    navigator.share({ title: eventTitle, text: shareText, url: shareUrl });
                  } else {
                    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                    import('sonner').then(({ toast }) => toast.success('Link copied to clipboard!'));
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Present your ticket QR code at the venue. You can also access your tickets in the Grid mobile app.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
