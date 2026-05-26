import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, User, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { TableContactDetails } from '@/types';

interface TableContactFormProps {
  orderId: string;
  onComplete: () => void;
}

const TableContactForm = ({ orderId, onComplete }: TableContactFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TableContactDetails>({
    fullName: '',
    phone: '',
    email: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast({ title: 'Name required', description: 'Please enter your full name.', variant: 'destructive' });
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast({ title: 'Valid phone required', description: 'Please enter a valid phone number.', variant: 'destructive' });
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({ title: 'Valid email required', description: 'Please enter a valid email address.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const updateOrderContactDetails = httpsCallable(functions, 'updateOrderContactDetails');
      
      await updateOrderContactDetails({
        orderId,
        contactDetails: {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          notes: formData.notes?.trim() || undefined,
        },
      });

      toast({
        title: 'Contact details saved!',
        description: 'Our team will reach out to you for table arrangements.',
      });

      onComplete();
    } catch (error: any) {
      console.error('Error saving contact details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save contact details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl bg-primary/5 border border-primary/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
          <Phone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Table Reservation Details</h3>
          <p className="text-sm text-muted-foreground">How can our team reach you for arrangements?</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Special Requests (Optional)
          </Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Any special requests or preferences for your table..."
            value={formData.notes}
            onChange={handleChange}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        <Button
          type="submit"
          variant="hero"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Contact Details
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
};

export default TableContactForm;
