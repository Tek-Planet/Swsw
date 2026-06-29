import { motion } from 'framer-motion';
import { TicketTier, SelectedTiers, EventCurrency } from '@/types';
import { Badge } from '@/components/ui/badge';

// Promo code data structure
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

interface OrderSummaryProps {
  tiers: TicketTier[];
  selectedTiers: SelectedTiers;
  showItems?: boolean;
  promoApplied?: PromoCodeData | null;
  currency?: EventCurrency;
  bookingFeePercent?: number;
  gstPercent?: number;
}

const DEFAULT_FEE_PERCENT = 0.10;

// Helper to get the amount charged for a tier
const getChargeAmount = (tier: TicketTier): number => {
  if (tier.type === 'table' && tier.chargeAmount != null) {
    return tier.chargeAmount;
  }
  return tier.price;
};

const calculateDiscount = (
  promoApplied: PromoCodeData | null | undefined,
  subtotal: number,
  discountableSubtotal: number
): number => {
  if (!promoApplied) return 0;

  const baseForDiscount = discountableSubtotal;

  switch (promoApplied.discountType) {
    case 'free':
      return baseForDiscount;
    case 'percent':
      return Math.round(baseForDiscount * (promoApplied.discountValue / 100));
    case 'fixed':
      return Math.min(promoApplied.discountValue, baseForDiscount);
    default:
      return 0;
  }
};

const OrderSummary = ({ 
  tiers, 
  selectedTiers, 
  showItems = true, 
  promoApplied = null,
  currency = 'INR',
  bookingFeePercent,
  gstPercent
}: OrderSummaryProps) => {
  const feePercent = bookingFeePercent != null ? bookingFeePercent / 100 : DEFAULT_FEE_PERCENT;
  const gstRate = gstPercent != null && gstPercent > 0 ? gstPercent / 100 : 0;
  
  const formatPrice = (price: number) => {
    const locale = currency === 'USD' ? 'en-US' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const selectedItems = tiers.filter(tier => selectedTiers[tier.id] > 0);
  
  const subtotalCharged = selectedItems.reduce((total, tier) => {
    const chargeAmount = getChargeAmount(tier);
    return total + (chargeAmount * selectedTiers[tier.id]);
  }, 0);

  const discountableSubtotal = selectedItems.reduce((total, tier) => {
    if (!promoApplied || !promoApplied.applicableTierIds || promoApplied.applicableTierIds.length === 0 || promoApplied.applicableTierIds.includes(tier.id)) {
      const chargeAmount = getChargeAmount(tier);
      return total + (chargeAmount * selectedTiers[tier.id]);
    }
    return total;
  }, 0);

  const feeBase = selectedItems.reduce((total, tier) => {
    if (tier.type === 'table') return total;
    const chargeAmount = getChargeAmount(tier);
    return total + (chargeAmount * selectedTiers[tier.id]);
  }, 0);

  const totalQuantity = Object.values(selectedTiers).reduce((a, b) => a + b, 0);

  let processingFee = feeBase > 0 ? Math.round(feeBase * feePercent) : 0;
  if (promoApplied?.waiveProcessingFee) {
    processingFee = 0;
  }
  
  const discount = calculateDiscount(promoApplied, subtotalCharged, discountableSubtotal);
  
  const taxableBase = Math.max(0, subtotalCharged - discount + processingFee);
  const gstAmount = gstRate > 0 ? Math.round(taxableBase * gstRate) : 0;
  const total = taxableBase + gstAmount;
  
  const feePercentDisplay = Math.round(feePercent * 100);
  const gstPercentDisplay = gstPercent ?? 0;
  
  const getPromoLabel = () => {
    if (!promoApplied) return '';
    switch (promoApplied.discountType) {
      case 'free':
        return '🎉 VIP Promo Applied';
      case 'percent':
        return `🎉 ${promoApplied.discountValue}% Off Applied`;
      case 'fixed':
        return `🎉 ${formatPrice(promoApplied.discountValue)} Off Applied`;
      default:
        return '🎉 Promo Applied';
    }
  };

  if (totalQuantity === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tickets selected</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {showItems && (
        <div className="space-y-3">
          {selectedItems.map((tier) => {
            const chargeAmount = getChargeAmount(tier);
            const isTable = tier.type === 'table';
            const lineTotal = chargeAmount * selectedTiers[tier.id];
            const isDiscounted = promoApplied && (!promoApplied.applicableTierIds || promoApplied.applicableTierIds.length === 0 || promoApplied.applicableTierIds.includes(tier.id));

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center py-3 border-b border-border"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{tier.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {isTable ? (
                      <>Deposit: {formatPrice(chargeAmount)} × {selectedTiers[tier.id]}</>
                    ) : (
                      <>{formatPrice(chargeAmount)} × {selectedTiers[tier.id]}</>
                    )}
                  </p>
                  {isDiscounted && <Badge variant="secondary">Discount applied</Badge>}
                  {isTable && tier.price !== chargeAmount && (
                    <p className="text-xs text-muted-foreground">
                      (Value: {formatPrice(tier.price)})
                    </p>
                  )}
                </div>
                <p className="font-display font-bold text-foreground">
                  {formatPrice(lineTotal)}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-border space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">Subtotal</p>
          <p className="font-medium text-foreground">{formatPrice(subtotalCharged)}</p>
        </div>

        {/* Promo Applied Badge - Now shown before the fee */}
        {promoApplied && discount > 0 && (
          <div className="flex justify-between items-center text-primary">
            <p className="text-sm font-medium">{getPromoLabel()}</p>
            <p className="font-medium">-{formatPrice(discount)}</p>
          </div>
        )}

        {/* Processing Fee */}
        {feeBase > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Processing fee ({feePercentDisplay}%)
            </p>
            <p className={`font-medium text-foreground ${promoApplied?.waiveProcessingFee ? 'line-through' : ''}`}>
              {formatPrice(processingFee)}
            </p>
          </div>
        )}
        {promoApplied?.waiveProcessingFee && feeBase > 0 && (
          <div className="text-right text-xs text-primary">Fee waived by promo</div>
        )}

        {/* Note when only tables selected (no fee) */}
        {feeBase === 0 && subtotalCharged > 0 && (
          <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">Processing fee</p>
            <p className="text-muted-foreground">{formatPrice(0)} (tables excluded)</p>
          </div>
        )}
        
        {/* GST / Tax */}
        {gstAmount > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">GST ({gstPercentDisplay}%)</p>
            <p className="font-medium text-foreground">{formatPrice(gstAmount)}</p>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <div>
            <p className="font-semibold text-foreground">Total</p>
            <p className="text-xs text-muted-foreground">
              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
            </p>
          </div>
          <p className="text-2xl font-display font-bold text-gradient">
            {formatPrice(total)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
