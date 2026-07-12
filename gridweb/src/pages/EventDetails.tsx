
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, ArrowLeft, Users, Music, Sparkles, ShieldCheck, CheckCircle2, Film } from "lucide-react";
import Navbar from "@/components/Navbar";
import TicketTierCard from "@/components/TicketTierCard";
import OrderSummary from "@/components/OrderSummary";
import EventApplicationForm from "@/components/EventApplicationForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import SeatMap from "@/components/SeatMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvent } from "@/hooks/useEvents";
import { useTicketTiers } from "@/hooks/useTicketTiers";
import { useAuth } from "@/contexts/AuthContext";
import { useEventApplications } from "@/hooks/useEventApplications";
import { useVenue } from "@/hooks/useVenue";
import { useEventSeats } from "@/hooks/useEventSeats";
import { SelectedTiers, GenderCategory, MAX_MOVIE_SEATS_PER_ORDER } from "@/types";
import { formatEventDate } from "@/lib/dateUtils";

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event, loading: eventLoading } = useEvent(eventId || "");
  const { tiers, loading: tiersLoading } = useTicketTiers(eventId || "");
  const { getUserApplication } = useEventApplications(eventId || "");
  const [selectedTiers, setSelectedTiers] = useState<SelectedTiers>({});
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const isMovie = event?.eventType === 'movie';
  const { venue } = useVenue(isMovie ? event?.venueId : undefined);
  const { seats: liveSeats } = useEventSeats(isMovie ? eventId : undefined);
  const [userApproved, setUserApproved] = useState(false);
  const [userGender, setUserGender] = useState<GenderCategory | undefined>();
  const [checkingApproval, setCheckingApproval] = useState(true);

  // Persist movie seat selection
  useEffect(() => {
    if (!isMovie || !eventId) return;
    const saved = localStorage.getItem(`grid_seats_${eventId}`);
    if (saved) {
      try { setSelectedSeats(JSON.parse(saved)); } catch {}
    }
  }, [isMovie, eventId]);

  console.log(event)

  const toggleSeat = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) return prev.filter((s) => s !== seatId);
      if (prev.length >= MAX_MOVIE_SEATS_PER_ORDER) return prev;
      return [...prev, seatId];
    });
  };

  const seatSubtotal = selectedSeats.reduce(
    (sum, id) => sum + Number(liveSeats[id]?.price ?? 0),
    0,
  );

  // Check if user has approved application for invite-only events
  useEffect(() => {
    const checkApproval = async () => {
      if (user && event?.isInviteOnly) {
        const app = await getUserApplication(user.uid);
        setUserApproved(app?.status === 'approved');
        if (app?.gender) setUserGender(app.gender);
      } else {
        setUserApproved(false);
      }
      setCheckingApproval(false);
    };
    checkApproval();
  }, [user, event?.isInviteOnly, eventId]);

  // Load saved selections from localStorage
  useEffect(() => {
    if (isMovie) return; // Don't load tier selections for movie events
    const saved = localStorage.getItem(`grid_selections_${eventId}`);
    if (saved) {
      try {
        setSelectedTiers(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved selections");
      }
    }
  }, [eventId, isMovie]);

  // Save selections to localStorage
  useEffect(() => {
    if (isMovie) return;
    localStorage.setItem(`grid_selections_${eventId}`, JSON.stringify(selectedTiers));
  }, [selectedTiers, eventId, isMovie]);

  const handleQuantityChange = (tierId: string, quantity: number) => {
    setSelectedTiers((prev) => ({
      ...prev,
      [tierId]: quantity,
    }));
  };

  const handleCheckout = () => {
    if (isMovie) {
      if (selectedSeats.length === 0) return;
      localStorage.setItem(`grid_seats_${eventId}`, JSON.stringify(selectedSeats));
    } else {
      const totalSelected = Object.values(selectedTiers).reduce((a, b) => a + b, 0);
      if (totalSelected === 0) return;
    }

    if (!user) {
      localStorage.setItem("grid_return_url", `/checkout?eventId=${eventId}`);
      navigate("/auth");
      return;
    }

    navigate(`/checkout?eventId=${eventId}`);
  };

  const totalSelected = Object.values(selectedTiers).reduce((a, b) => a + b, 0);
  const areTicketsOnSale = !event?.ticketsAvailableOn || new Date() >= event.ticketsAvailableOn.toDate();

  if (eventLoading || tiersLoading) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="Loading event..." />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">Event not found</p>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden gradient-hero pt-2 lg:mt-0">
      <Navbar />

      <div className="h-[calc(100vh-48px)] mt-12 flex flex-col lg:flex-row">
        {/* Left Side - Static Event Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-1/2 lg:h-full relative lg:sticky lg:top-0 h-64 lg:h-auto shrink-0"
        >
          <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-contain object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent lg:hidden" />

          {/* Back button overlay */}
          <Button
            onClick={() => navigate(-1)}
            variant="glass"
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="ml-2">Back</span>
          </Button>
        </motion.div>

        {/* Right Side - Scrollable Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:w-1/2 flex-1 overflow-y-auto"
        >
          <div className="p-6 lg:p-10 space-y-8">
            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <div className="glass rounded-lg px-3 py-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Live Event</div>
                </div>
                {event.isInviteOnly && !isMovie && (
                  <div className="glass rounded-lg px-3 py-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary font-medium">Invite Only</span>
                  </div>
                )}
                 {isMovie && (
                  <div className="glass rounded-lg px-3 py-2 flex items-center gap-1">
                    <Film className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary font-medium">Movie / Cinema</span>
                  </div>
                )}
                 {event.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">{event.title}</h1>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-foreground">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{formatEventDate(event.startTime, event.endTime)}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{event.location?.city}</span>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold text-foreground">About This Event</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{event.description}</p>
            </div>

            {/* Movie seat map OR application / regular ticket flow */}
            {isMovie ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" /> Pick Your Seats
                </h2>
                {!venue ? (
                  <LoadingSpinner size="md" text="Loading seat map..." />
                ) : (
                  <SeatMap
                    venue={venue}
                    seats={liveSeats}
                    soldSeatIds={event.soldSeatIds || []}
                    selected={selectedSeats}
                    onToggle={toggleSeat}
                    currency={event.currency || 'HKD'}
                  />
                )}
                <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{selectedSeats.length} seat(s) selected</span>
                    <span className="font-display font-bold text-lg text-foreground">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: event.currency || 'HKD', maximumFractionDigits: 0 }).format(seatSubtotal)}
                    </span>
                  </div>
                  {selectedSeats.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedSeats.map((id) => {
                        const s = liveSeats[id];
                        return s ? `Row ${s.rowLabel} · Seat ${s.seatLabel}` : id;
                      }).join('  •  ')}
                    </p>
                  )}
                  <Button
                    variant="hero"
                    className="w-full"
                    disabled={selectedSeats.length === 0}
                    onClick={handleCheckout}
                  >
                    {selectedSeats.length === 0 ? 'Select seats' : 'Continue to Checkout'}
                  </Button>
                </div>
              </div>
            ) : event.isInviteOnly && !userApproved ? (
              <EventApplicationForm
                eventId={eventId || ''}
                tiers={tiers}
                customQuestions={event.customQuestions}
              />
            ) : (
              <>
                {/* Approved banner for invite-only */}
                {event.isInviteOnly && userApproved && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">You're on the Grid!</span> Complete your registration by selecting and purchasing your ticket below.
                    </p>
                  </motion.div>
                )}

                

                {/* Tickets Section */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-display font-bold text-foreground">Select Tickets</h2>
                  {!areTicketsOnSale ? (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-sm text-yellow-500">
                        Tickets for this event will go on sale on {formatEventDate(event.ticketsAvailableOn, undefined)}.
                      </p>
                    </div>
                  ) : tiers.length === 0 ? (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm text-blue-500">
                        Ticket information is not yet available for this event.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tiers.map((tier, index) => (
                        <TicketTierCard
                          key={tier.id}
                          tier={tier}
                          quantity={selectedTiers[tier.id] || 0}
                          onQuantityChange={(qty) => handleQuantityChange(tier.id, qty)}
                          index={index}
                          currency={event.currency}
                          userGender={event.isInviteOnly ? userGender : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                {areTicketsOnSale && tiers.length > 0 && (
                  <div className="p-6 rounded-2xl bg-card border border-border">
                    <h3 className="text-lg font-display font-bold text-foreground mb-4">Order Summary</h3>
                    <OrderSummary
                      tiers={tiers}
                      selectedTiers={selectedTiers}
                      currency={event.currency}
                      bookingFeePercent={event.bookingFeePercent}
                      gstPercent={event.gstPercent}
                    />
                    <Button variant="hero" className="w-full mt-6" disabled={totalSelected === 0} onClick={handleCheckout}>
                      {totalSelected === 0 ? "Select Tickets" : "Continue to Checkout"}
                    </Button>
                    {!user && totalSelected > 0 && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        You'll need to sign in to complete your purchase
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            <footer className="py-6 border-t border-border">
              <p className="text-muted-foreground text-sm text-center">
                © {new Date().getFullYear()} Grid. All rights reserved.
              </p>
            </footer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EventDetails;
