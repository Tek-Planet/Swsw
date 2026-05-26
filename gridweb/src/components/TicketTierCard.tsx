import { motion } from 'framer-motion';
import { Ticket, Star, Crown, Users, Gift, Check } from 'lucide-react';
import QuantityStepper from './QuantityStepper';
import { TicketTier, EventCurrency } from '@/types';
import { cn } from '@/lib/utils';

interface TicketTierCardProps {
  tier: TicketTier;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  index?: number;
  currency?: EventCurrency;
  userGender?: 'male' | 'female' | 'other';
}

const TicketTierCard = ({ tier, quantity, onQuantityChange, index = 0, currency = 'INR', userGender }: TicketTierCardProps) => {
  const formatPrice = (price: number) => {
    const locale = currency === 'USD' ? 'en-US' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getIcon = () => {
    if (tier.type === 'table') return <Users className="w-4 h-4" />;
    switch (tier.name.toLowerCase()) {
      case 'vip experience':
      case 'vip':
        return <Crown className="w-4 h-4" />;
      case 'early bird':
        return <Star className="w-4 h-4" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
  };

  const isSelected = quantity > 0;
  const remaining = tier.quantityTotal != null && tier.quantitySold != null 
    ? tier.quantityTotal - tier.quantitySold 
    : undefined;
  
  // Gender-based sold out check
  const isGenderSoldOut = (() => {
    if (!userGender || !tier.genderQuotas || !tier.genderSold) return false;
    const quota = tier.genderQuotas[userGender] ?? Infinity;
    const sold = tier.genderSold[userGender] ?? 0;
    return sold >= quota;
  })();

  const isSoldOut = (remaining !== undefined && remaining <= 0) || isGenderSoldOut;

  const isFree = tier.price === 0;
  const isTable = tier.type === 'table';
  const chargeAmount = isTable && tier.chargeAmount != null ? tier.chargeAmount : tier.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "relative rounded-2xl border transition-all duration-300 overflow-hidden",
        isSoldOut 
          ? "bg-muted/50 border-border opacity-60 cursor-not-allowed"
          : isSelected 
            ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
            : "bg-card border-border hover:border-primary/40"
      )}
    >
      {/* Header Row */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon + Title + Badges */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              "flex-shrink-0 p-2.5 rounded-xl transition-colors",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {getIcon()}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <h4 className="font-display font-semibold text-foreground truncate">
                  {tier.name}
                </h4>
                {tier.type === 'addon' && (
                  <span className="text-[10px] text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-md uppercase tracking-wide font-medium">Add-on</span>
                )}
                {isTable && (
                  <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase tracking-wide font-medium">Table</span>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {tier.description}
              </p>
            </div>
          </div>

          {/* Right: Selection Check (mobile indicator) */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
            >
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Footer Row: Price + Stepper */}
      <div className="p-4 pt-3 flex items-center justify-between gap-4">
        {/* Price Section */}
        <div className="flex flex-col">
          {isTable ? (
            <>
              <span className="text-lg font-display font-bold text-foreground leading-tight">
                {formatPrice(tier.price)}
              </span>
              <span className="text-xs text-primary font-medium">
                {formatPrice(chargeAmount)} deposit
              </span>
            </>
          ) : isFree ? (
            <span className="text-lg font-display font-bold text-emerald-500 flex items-center gap-1.5">
              <Gift className="w-4 h-4" />
              Free
            </span>
          ) : (
            <span className="text-lg font-display font-bold text-gradient">
              {formatPrice(tier.price)}
            </span>
          )}
          
          {remaining !== undefined && remaining < 50 && (
            <span className={cn(
              "text-[10px] font-medium mt-1",
              isSoldOut ? "text-muted-foreground" : "text-destructive"
            )}>
              {isSoldOut ? "Sold out" : `Only ${remaining} left`}
            </span>
          )}
        </div>

        {/* Quantity Stepper */}
        {isSoldOut ? (
          <span className="text-sm text-muted-foreground font-medium px-4">Sold out</span>
        ) : (
          <QuantityStepper
            value={quantity}
            onChange={onQuantityChange}
            max={remaining !== undefined ? remaining : 10}
          />
        )}
      </div>
    </motion.div>
  );
};

export default TicketTierCard;
