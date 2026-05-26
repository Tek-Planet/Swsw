import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

const QuantityStepper = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 10,
  className 
}: QuantityStepperProps) => {
  const decrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const increase = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={decrease}
        disabled={value <= min}
        className="h-8 w-8 rounded-full border-border/60"
      >
        <Minus className="w-3.5 h-3.5" />
      </Button>
      
      <motion.div
        key={value}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        className="w-7 text-center font-display font-bold text-base text-foreground"
      >
        {value}
      </motion.div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={increase}
        disabled={value >= max}
        className="h-8 w-8 rounded-full border-border/60"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default QuantityStepper;
