import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Loader2, Users, Heart } from "lucide-react";
import GooglePayButton from "@google-pay/button-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useEventApplications } from "@/hooks/useEventApplications";
import Navbar from "@/components/Navbar";
import OrderSummary from "@/components/OrderSummary";
import LoadingSpinner from "@/components/LoadingSpinner";
import AttendeeInfoForm from "@/components/AttendeeInfoForm";
import DonorInfoForm from "@/components/DonorInfoForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEvent } from "@/hooks/useEvents";
import { useTicketTiers } from "@/hooks/useTicketTiers";
import { useVenue } from "@/hooks/useVenue";
import { useAuth } from "@/contexts/AuthContext";
import { useGooglePay } from "@/hooks/useGooglePay";
import { httpsCallable } from "firebase/functions";
import { functions, db } from "@/lib/firebase";
import { SelectedTiers, AttendeeInfo, TicketTier } from "@/types";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Promo code types
interface PromoCodeData {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed' | 'free';
  discountValue: number;
  applicableTierIds?: string[];
  maxRedemptions: number;
  currentRedemptions: number;
  isActive: boolean;
  waiveProcessingFee: boolean;
  eventId: string;
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const eventId = searchParams.get("eventId") || "";

  const { event, loading: eventLoading } = useEvent(eventId);
  const { tiers: regularTiers, loading: tiersLoading } = useTicketTiers(eventId);
  const { venue, loading: venueLoading } = useVenue(event?.venueId);

  const [checkoutTiers, setCheckoutTiers] = useState<TicketTier[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<SelectedTiers>({});
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const [attendees, setAttendees] = useState<AttendeeInfo[]>([]);
  const [attendeeErrors, setAttendeeErrors] = useState(false);
  const [donor, setDonor] = useState<AttendeeInfo>({ name: "", email: "", phone: "" });
  const [donorErrors, setDonorErrors] = useState(false);
  const [useAttendeeDetails, setUseAttendeeDetails] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<PromoCodeData | null>(null);
  const [promoValidating, setPromoValidating] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGPayProcessing, setIsGPayProcessing] = useState(false);
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);


  // Get fee percent from event or default to 10%
  const feePercent = event?.bookingFeePercent != null ? event.bookingFeePercent / 100 : 0.10;
  const currency = event?.currency || 'INR';

  useEffect(() => {
    if (currency === 'INR') {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
    }
  }, [currency]);

  // Validate promo code against Firestore
  const validatePromoCode = async (code: string) => {
    if (!code.trim() || !eventId) {
      console.log("[Promo] Validation skipped - code or eventId missing", { code, eventId });
      return;
    }
    
    setPromoValidating(true);
    try {
      const upperCode = code.trim().toUpperCase();
      console.log("[Promo] Validating code:", upperCode, "for eventId:", eventId);
      
      const promoQuery = query(
        collection(db, 'promoCodes'),
        where('eventId', '==', eventId),
        where('code', '==', upperCode)
      );
      const snapshot = await getDocs(promoQuery);
      
      console.log("[Promo] Query result - found:", snapshot.size, "documents");
      
      if (snapshot.empty) {
        setPromoApplied(null);
        toast({
          title: "Invalid Code",
          description: "This promo code is not valid for this event.",
          variant: "destructive",
        });
        return;
      }

      const promoDoc = snapshot.docs[0];
      const promoData = { id: promoDoc.id, ...promoDoc.data() } as PromoCodeData;
      
      // Check if active
      if (!promoData.isActive) {
        setPromoApplied(null);
        toast({
          title: "Code Inactive",
          description: "This promo code is no longer active.",
          variant: "destructive",
        });
        return;
      }

      // Check redemption limit
      if (promoData.currentRedemptions >= promoData.maxRedemptions) {
        setPromoApplied(null);
        toast({
          title: "Code Expired",
          description: "This promo code has reached its usage limit.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if the promo applies to any of the selected tiers
      const { applicableTierIds } = promoData;
      if (applicableTierIds && applicableTierIds.length > 0) {
        const selectedTierIds = Object.keys(selectedTiers).filter(id => selectedTiers[id] > 0);
        const isApplicable = selectedTierIds.some(id => applicableTierIds.includes(id));
        
        if (!isApplicable) {
          setPromoApplied(null);
          toast({
            title: "Code Not Applicable",
            description: "This promo code cannot be used with the selected tickets.",
            variant: "destructive",
          });
          return; // Stop further processing
        }
      }

      setPromoApplied(promoData);
      toast({
        title: "Promo Applied!",
        description: promoData.discountType === 'free' 
          ? "VIP promo applied!" 
          : promoData.discountType === 'percent'
            ? `${promoData.discountValue}% off applied!`
            : `${currency} ${promoData.discountValue} off applied!`,
      });
    } catch (error: any) {
      console.error("[Promo] Error validating promo:", error);
      // Check if it's a missing index error
      if (error?.message?.includes('index')) {
        toast({
          title: "Configuration Error",
          description: "Promo codes are not configured correctly. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to validate promo code. Please try again.",
          variant: "destructive",
        });
      }
      setPromoApplied(null);
    } finally {
      setPromoValidating(false);
    }
  };

  // Calculate discount amount
  const calculateDiscount = (
    subtotal: number,
    processingFee: number,
    discountableSubtotal: number
  ): number => {
    if (!promoApplied) return 0;

    const baseForDiscount = discountableSubtotal;

    switch (promoApplied.discountType) {
      case "free":
        return baseForDiscount;
      case "percent":
        return Math.round(baseForDiscount * (promoApplied.discountValue / 100));
      case "fixed":
        return Math.min(promoApplied.discountValue, baseForDiscount);
      default:
        return 0;
    }
  };

  // Calculate total for Google Pay
  const orderTotal = useMemo(() => {
    let subtotal = 0;
    let feeBase = 0;
    let discountableSubtotal = 0;

    Object.entries(selectedTiers).forEach(([tierId, qty]) => {
      const tier = checkoutTiers.find((t) => t.id === tierId);
      if (tier && qty > 0) {
        const chargeAmount = tier.chargeAmount ?? tier.price;
        subtotal += chargeAmount * qty;
        if (promoApplied && (!promoApplied.applicableTierIds || promoApplied.applicableTierIds.length === 0 || promoApplied.applicableTierIds.includes(tier.id))) {
            discountableSubtotal += chargeAmount * qty;
        }

        if (tier.type !== "table") {
          feeBase += chargeAmount * qty;
        }
      }
    });

    let processingFee = feeBase > 0 ? Math.round(feeBase * feePercent) : 0;
    if (promoApplied?.waiveProcessingFee) {
      processingFee = 0;
    }

    const discount = calculateDiscount(subtotal, processingFee, discountableSubtotal);
    return Math.max(0, subtotal + processingFee - discount);
  }, [selectedTiers, checkoutTiers, promoApplied, feePercent]);

  const { isAvailable: isGPayAvailable, environment, allowedPaymentMethods, merchantInfo } = useGooglePay(orderTotal);

  // Load and validate selections from localStorage
   useEffect(() => {
    if (eventLoading || !event || !eventId) return;

    // MOVIE EVENT: Load selected seats and generate tiers
    if (event.eventType === 'movie') {
      if (venueLoading || !venue) return;

      const savedSeatsData = localStorage.getItem(`grid_seats_${eventId}`);
      const seats = savedSeatsData ? JSON.parse(savedSeatsData) : [];
      setSelectedSeats(seats);

      if (seats.length > 0) {
        const priceGroups = seats.reduce((acc: Record<number, number>, seatId: string) => {
          const [rowLabel] = seatId.split('-');
          const row = venue.rows.find((r) => r.label === rowLabel);
          if (row) {
            const price = row.price;
            if (!acc[price]) acc[price] = 0;
            acc[price]++;
          }
          return acc;
        }, {});

        const generatedTiers: TicketTier[] = [];
        const generatedSelectedTiers = {};

        Object.entries(priceGroups).forEach(([price, qty], index) => {
          const priceNum = Number(price);
          const tierId = `movie-tier-${priceNum}`;

          generatedTiers.push({
            id: tierId,
            name: 'Movie Seat',
            description: `${qty} x ${event.currency} ${priceNum.toFixed(2)}`,
            price: priceNum,
            currency: event.currency || 'USD',
            type: 'ticket',
            isActive: true,
            sortOrder: index,
          });
          generatedSelectedTiers[tierId] = qty;
        });

        setCheckoutTiers(generatedTiers);
        setSelectedTiers(generatedSelectedTiers);
      }
      return;
    }

    // REGULAR EVENT: Load selected tiers
    if (event.eventType === 'regular') {
      if (tiersLoading || !regularTiers) return;

      setCheckoutTiers(regularTiers);
      const savedTiersData = localStorage.getItem(`grid_selections_${eventId}`);
      if (savedTiersData) {
        try {
          const savedTiers: SelectedTiers = JSON.parse(savedTiersData);
          const validatedTiers: SelectedTiers = {};
          let wasModified = false;

          Object.entries(savedTiers).forEach(([tierId, quantity]) => {
            const tier = regularTiers.find((t) => t.id === tierId);
            if (tier && tier.isActive) {
              const hasLimitedStock = tier.quantityTotal != null && tier.quantitySold != null;
              const availableStock = hasLimitedStock ? tier.quantityTotal! - tier.quantitySold! : Infinity;
              if (availableStock > 0) {
                if (quantity > availableStock) {
                  validatedTiers[tierId] = availableStock;
                  wasModified = true;
                } else {
                  validatedTiers[tierId] = quantity;
                }
              } else {
                wasModified = true;
              }
            } else {
              wasModified = true;
            }
          });

          setSelectedTiers(validatedTiers);

          if (wasModified) {
            toast({ title: "Your cart was updated", description: "Some items were adjusted due to availability." });
            localStorage.setItem(`grid_selections_${eventId}`, JSON.stringify(validatedTiers));
          }
        } catch (e) {
          console.error("Error parsing saved selections", e);
          localStorage.removeItem(`grid_selections_${eventId}`);
        }
      }
    }
  }, [event, eventLoading, eventId, regularTiers, tiersLoading, venue, venueLoading, toast]);

  // Calculate total ticket count (excluding donations for attendee info)
  const ticketCount = useMemo(() => {
    return Object.entries(selectedTiers).reduce((count, [tierId, qty]) => {
      const tier = checkoutTiers.find((t) => t.id === tierId);
      if (tier && tier.type !== 'donation') {
        return count + qty;
      }
      return count;
    }, 0);
  }, [selectedTiers, checkoutTiers]);

  const hasDonation = useMemo(() => {
    return Object.entries(selectedTiers).some(([tierId, qty]) => {
        const tier = checkoutTiers.find((t) => t.id === tierId);
        return tier && tier.type === 'donation' && qty > 0;
    });
  }, [selectedTiers, checkoutTiers]);

  // Initialize attendees array when ticket count changes
  useEffect(() => {
    setAttendees((prev) => {
      const newAttendees: AttendeeInfo[] = [];
      for (let i = 0; i < ticketCount; i++) {
        newAttendees.push(prev[i] || { name: "", email: "", phone: "" });
      }
      return newAttendees;
    });
  }, [ticketCount]);

  // Handle attendee info change
  const handleAttendeeChange = (index: number, field: keyof AttendeeInfo, value: string) => {
    setAttendees((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handle donor info change
  const handleDonorChange = (field: keyof AttendeeInfo, value: string) => {
    setDonor((prev) => ({ ...prev, [field]: value }));
  };

  // Handle "Use Attendee Details" checkbox
  const handleUseAttendeeDetailsChange = (checked: boolean) => {
    setUseAttendeeDetails(checked);
    if (checked && attendees[0]) {
        setDonor(attendees[0]);
    } else {
        setDonor({ name: "", email: "", phone: "" });
    }
  };

  // Sync donor details if attendee 1 details change
  useEffect(() => {
    if (useAttendeeDetails && attendees[0]) {
        setDonor(attendees[0]);
    }
  }, [attendees, useAttendeeDetails]);


  // Redirect if not logged in
  useEffect(() => {
    if (!user && !eventLoading) {
      localStorage.setItem("grid_return_url", `/checkout?eventId=${eventId}`);
      navigate("/auth");
    }
  }, [user, eventLoading, navigate, eventId]);

  // Validate invite-only approval
  const { getUserApplication } = useEventApplications(eventId);
  const [inviteApproved, setInviteApproved] = useState<boolean | null>(null);

  useEffect(() => {
    const checkInviteApproval = async () => {
      if (!user || !event) return;
      if (!event.isInviteOnly) {
        setInviteApproved(true);
        return;
      }
      const app = await getUserApplication(user.uid);
      setInviteApproved(app?.status === 'approved');
    };
    checkInviteApproval();
  }, [user, event]);

  // Validate all attendee fields are filled
  const validateAttendees = (): boolean => {
    if (ticketCount === 0) return true;
    const allFieldsFilled = attendees.every(a => 
      a.name.trim() && 
      a.email.trim() && a.email.includes('@') &&
      a.phone.trim() && a.phone.length >= 10
    );
    setAttendeeErrors(!allFieldsFilled);
    return allFieldsFilled;
  };

  const validateDonor = (): boolean => {
    if (!hasDonation) return true;
    const allFieldsFilled = 
        donor.name.trim() &&
        donor.email.trim() && donor.email.includes('@') &&
        donor.phone.trim() && donor.phone.length >= 10;
    setDonorErrors(!allFieldsFilled);
    return allFieldsFilled;
  };

  const handleStripePayment = async () => {
    if (inviteApproved === false) {
      toast({ title: "Not Approved", description: "You need an approved application to purchase tickets for this event.", variant: "destructive" });
      return;
    }
    if (!validateAttendees()) {
      toast({
        title: "Attendee Details Required",
        description: "Please enter name, email, and phone for each ticket holder.",
        variant: "destructive",
      });
      return;
    }

    if (!validateDonor()) {
      toast({
        title: "Donor Details Required",
        description: "Please enter name, email, and phone for the donor.",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    setIsProcessing(true);

    try {
      // Call Firebase Cloud Function to create Stripe checkout session
      const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");

      const tiersToSend: Record<string, number> = {};
      Object.entries(selectedTiers).forEach(([tierId, qty]) => {
        if (qty > 0) {
          tiersToSend[tierId] = qty;
        }
      });

      const filledAttendees = attendees.filter(a => a.name.trim());

      const payload: any = {
        eventId,
        promoCode: promoCode.trim().toUpperCase() || undefined,
        attendees: filledAttendees,
        donor: hasDonation ? donor : undefined,
      };

      if (event?.eventType === 'movie' && selectedSeats.length > 0) {
        payload.selectedSeats = selectedSeats;
      } else {
        payload.selectedTiers = tiersToSend;
      }

      console.log("Sending to checkout:", payload);

      const result = await createCheckoutSession(payload);

      const data = result.data as { url?: string; orderId: string; free?: boolean; vip?: boolean };

      // Clear selections
      localStorage.removeItem(`grid_selections_${eventId}`);
      if (event?.eventType === 'movie') {
        localStorage.removeItem(`grid_seats_${eventId}`);
      }

      if (data.free || data.vip) {
        // Free tier or VIP promo - order is already paid, skip Stripe
        toast({
          title: data.vip ? "VIP Access Granted!" : "Order Confirmed!",
          description: "Your tickets have been reserved.",
        });
        navigate(`/success?orderId=${data.orderId}`);
      } else if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Unable to process your order. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (inviteApproved === false) {
      toast({ title: "Not Approved", description: "You need an approved application to purchase tickets for this event.", variant: "destructive" });
      return;
    }
    if (!validateAttendees()) {
      toast({
        title: "Attendee Details Required",
        description: "Please enter name, email, and phone for each ticket holder.",
        variant: "destructive",
      });
      return;
    }

    if (!validateDonor()) {
      toast({
        title: "Donor Details Required",
        description: "Please enter name, email, and phone for the donor.",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    setIsRazorpayProcessing(true);

    try {
      const createRazorpayOrder = httpsCallable(functions, "createRazorpayOrder");

      const tiersToSend: Record<string, number> = {};
      Object.entries(selectedTiers).forEach(([tierId, qty]) => {
        if (qty > 0) {
          tiersToSend[tierId] = qty;
        }
      });

      const filledAttendees = attendees.filter(a => a.name.trim());

      const payload: any = {
        eventId,
        promoCode: promoCode.trim().toUpperCase() || undefined,
        attendees: filledAttendees,
        donor: hasDonation ? donor : undefined,
      };

      if (event?.eventType === 'movie' && selectedSeats.length > 0) {
        payload.selectedSeats = selectedSeats;
      } else {
        payload.selectedTiers = tiersToSend;
      }

      console.log("Sending to createRazorpayOrder:", payload);

      const result = await createRazorpayOrder(payload);
      const data = result.data as {
        orderId: string;
        razorpayOrderId: string;
        amount: number;
        currency: string;
        free?: boolean;
      };

      localStorage.removeItem(`grid_selections_${eventId}`);
      if (event?.eventType === 'movie') {
        localStorage.removeItem(`grid_seats_${eventId}`);
      }

      if (data.free) {
        toast({
          title: "Order Confirmed!",
          description: "Your tickets have been reserved.",
        });
        navigate(`/success?orderId=${data.orderId}`);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "GridEvents",
        description: `Order #${data.orderId}`,
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
            console.log("Razerpay response", response)
            try {
                const verifyPayment = httpsCallable(functions, "verifyRazorpayPayment");
                await verifyPayment({
                    orderId: data.orderId,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature,
                });
                navigate(`/success?orderId=${data.orderId}`);
            } catch (error) {
                console.error("Payment verification failed", error);
                toast({ title: "Payment Failed", description: "Your payment could not be verified. Please contact support.", variant: "destructive" });
                setIsRazorpayProcessing(false);
            }
        },
        prefill: {
            name: user.displayName || "",
            email: user.email || "",
            contact: user.phoneNumber || ""
        },
        notes: {
            orderId: data.orderId,
            eventId: eventId
        },
        theme: {
            color: "#3399cc"
        },
        modal: {
            ondismiss: () => {
                setIsRazorpayProcessing(false);
            }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error("Razorpay error:", error);
      toast({
        title: "Razorpay Failed",
        description: error.message || "Unable to process your order with Razorpay. Please try again.",
        variant: "destructive",
      });
      setIsRazorpayProcessing(false);
    }
  };


  // Handle Google Pay payment
  const handleGooglePayPayment = async (paymentData: google.payments.api.PaymentData) => {
    if (!validateAttendees()) {
      toast({
        title: "Attendee Names Required",
        description: "Please enter a name for each ticket holder.",
        variant: "destructive",
      });
      return;
    }

    if (!validateDonor()) {
      toast({
        title: "Donor Details Required",
        description: "Please enter name, email, and phone for the donor.",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    setIsGPayProcessing(true);

    try {
      const gpayCharge = httpsCallable(functions, "gpayCharge");

      const tiersToSend: Record<string, number> = {};
      Object.entries(selectedTiers).forEach(([tierId, qty]) => {
        if (qty > 0) {
          tiersToSend[tierId] = qty;
        }
      });

      // Extract the Stripe PaymentMethod ID from Google Pay response
      const tokenData = JSON.parse(paymentData.paymentMethodData.tokenizationData.token);
      const paymentMethodId = tokenData.id; // This is the Stripe PaymentMethod ID (pm_xxx)

      const filledAttendees = attendees.filter(a => a.name.trim());

      const payload: any = {
        eventId,
        promoCode: promoCode.trim().toUpperCase() || undefined,
        paymentMethodId,
        attendees: filledAttendees,
        donor: hasDonation ? donor : undefined,
      };

      if (event?.eventType === 'movie' && selectedSeats.length > 0) {
        payload.selectedSeats = selectedSeats;
      } else {
        payload.selectedTiers = tiersToSend;
      }

      console.log("Sending to gpayCharge:", payload);

      const result = await gpayCharge(payload);
      const data = result.data as { orderId: string; success: boolean };

      // Clear selections
      localStorage.removeItem(`grid_selections_${eventId}`);
      if (event?.eventType === 'movie') {
        localStorage.removeItem(`grid_seats_${eventId}`);
      }

      toast({
        title: "Payment Successful!",
        description: "Your tickets have been reserved.",
      });
      navigate(`/success?orderId=${data.orderId}`);
    } catch (error: any) {
      console.error("Google Pay error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to process your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGPayProcessing(false);
    }
  };

  const totalSelected = Object.values(selectedTiers).reduce((a, b) => a + b, 0);

  if (eventLoading || tiersLoading || (event?.eventType === 'movie' && venueLoading)) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="Loading checkout..." />
        </div>
      </div>
    );
  }

  if (!event || totalSelected === 0) {
    return (
      <div className="min-h-screen gradient-hero">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">Your cart is empty</p>
          <Link to={eventId ? `/events/${eventId}` : "/"}>
            <Button variant="outline">Back to Event</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      <div className="pt-28 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link
            to={`/events/${eventId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-5 gap-8"
          >
            {/* Left Column - Order Details */}
            <div className="lg:col-span-3 space-y-6">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Checkout</h1>
                <p className="text-muted-foreground mb-6">{event.title}</p>

                {/* Order Items */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Order Details</h2>
                  <OrderSummary 
                    tiers={checkoutTiers} 
                    selectedTiers={selectedTiers} 
                    promoApplied={promoApplied}
                    currency={currency}
                    bookingFeePercent={event?.bookingFeePercent}
                  />
                </div>

                {/* Attendee Information */}
                {ticketCount > 0 && (
                  <div className="pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Attendee Details</h2>
                      <span className="text-xs text-destructive">* Required</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter the name for each ticket holder. This is required for check-in.
                    </p>
                    <div className="space-y-4">
                      {attendees.map((attendee, index) => (
                        <AttendeeInfoForm
                          key={index}
                          index={index}
                          attendee={attendee}
                          onChange={handleAttendeeChange}
                          isBooker={index === 0}
                          showError={attendeeErrors}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Donor Information */}
                {hasDonation && (
                    <div className="pt-6 border-t border-border">
                        <div className="flex items-center gap-2 mb-4">
                            <Heart className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-semibold text-foreground">Donor Details</h2>
                            <span className="text-xs text-destructive">* Required</span>
                        </div>
                        <DonorInfoForm
                            donor={donor}
                            onChange={handleDonorChange}
                            onUseAttendeeDetailsChange={handleUseAttendeeDetailsChange}
                            useAttendeeDetails={useAttendeeDetails}
                            isBooker={ticketCount > 0}
                            showError={donorErrors}
                        />
                    </div>
                )}

                {/* Promo Code */}
                <div className="pt-6 border-t border-border">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Promo Code</h2>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        if (!e.target.value.trim()) {
                          setPromoApplied(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          validatePromoCode(promoCode);
                        }
                      }}
                      className="flex-1"
                      disabled={isProcessing || promoValidating}
                    />
                    {promoApplied ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPromoApplied(null);
                          setPromoCode("");
                        }}
                        className="text-muted-foreground"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => validatePromoCode(promoCode)}
                        disabled={!promoCode.trim() || promoValidating}
                      >
                        {promoValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                      </Button>
                    )}
                  </div>
                  {promoApplied && (
                    <p className="text-xs text-primary mt-2">
                      🎉 {promoApplied.discountType === 'free' 
                        ? "VIP promo applied!" 
                        : promoApplied.discountType === 'percent'
                          ? `${promoApplied.discountValue}% off applied!`
                          : `${currency} ${promoApplied.discountValue} off applied!`}
                    </p>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    I agree to the Terms of Service and Privacy Policy. I understand that all sales are final and
                    tickets are non-refundable.
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Payment */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-28 p-6 rounded-2xl bg-card border border-border space-y-6"
              >
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground mb-4">Payment Summary</h2>
                  <OrderSummary
                    tiers={checkoutTiers}
                    selectedTiers={selectedTiers}
                    showItems={false}
                    promoApplied={promoApplied}
                    currency={currency}
                    bookingFeePercent={event?.bookingFeePercent}
                  />
                </div>

                {currency === 'INR' ? (
                    <>
                        <Button
                        variant="hero"
                        className="w-full"
                        onClick={handleRazorpayPayment}
                        disabled={!agreedToTerms || isProcessing || isGPayProcessing || isRazorpayProcessing}
                        >
                        {isRazorpayProcessing ? (
                            <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                            </>
                        ) : (
                            "Pay with Razorpay"
                        )}
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Shield className="w-4 h-4" />
                            <span>Secure checkout powered by Razorpay</span>
                        </div>
                    </>
                ) : (
                    <>
                        {isGPayAvailable &&
                        orderTotal > 0 &&
                        agreedToTerms &&
                        !isProcessing &&
                        !isGPayProcessing && (
                            <div className="space-y-3">
                            <GooglePayButton
                                environment={environment}
                                paymentRequest={{
                                apiVersion: 2,
                                apiVersionMinor: 0,
                                allowedPaymentMethods,
                                transactionInfo: {
                                    totalPriceStatus: "FINAL",
                                    totalPrice: orderTotal.toFixed(2),
                                    currencyCode: currency,
                                    countryCode: currency === 'USD' ? 'US' : currency === 'HKD' ? 'HK' : currency === 'SGD' ? 'SG' : 'IN',
                                },
                                merchantInfo,
                                }}
                                onLoadPaymentData={handleGooglePayPayment}
                                buttonColor="black"
                                buttonType="pay"
                                buttonSizeMode="fill"
                                style={{ width: "100%", height: 48 }}
                            />
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">or</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>
                            </div>
                        )}

                        <Button
                        variant="hero"
                        className="w-full"
                        onClick={handleStripePayment}
                        disabled={!agreedToTerms || isProcessing || isGPayProcessing}
                        >
                        {isProcessing ? (
                            <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                            </>
                        ) : (
                            "Pay with Card"
                        )}
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Shield className="w-4 h-4" />
                            <span>Secure checkout powered by Stripe</span>
                        </div>
                    </>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
