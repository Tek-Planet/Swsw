import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useEventApplications, ApplicationFormData } from '@/hooks/useEventApplications';
import { TicketTier, CustomQuestion, EventApplication, GenderCategory } from '@/types';

const applicationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().min(5, 'Phone is required').max(20),
  gender: z.enum(['male', 'female', 'other']),
  age: z.number().min(16, 'Must be at least 16').max(120),
  tierId: z.string().min(1, 'Please select a ticket type'),
  reason: z.string().min(10, 'Please tell us why you want to join (min 10 chars)').max(500),
});

type FormValues = z.infer<typeof applicationSchema>;

interface EventApplicationFormProps {
  eventId: string;
  tiers: TicketTier[];
  customQuestions?: CustomQuestion[];
}

const EventApplicationForm = ({ eventId, tiers, customQuestions = [] }: EventApplicationFormProps) => {
  const { user } = useAuth();
  const { submitApplication, getUserApplication } = useEventApplications(eventId);
  const [existingApp, setExistingApp] = useState<EventApplication | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      gender: undefined,
      age: undefined,
      tierId: '',
      reason: '',
    },
  });

  useEffect(() => {
    const check = async () => {
      if (user) {
        const app = await getUserApplication(user.uid);
        setExistingApp(app);
      }
      setCheckingExisting(false);
    };
    check();
  }, [user, eventId]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);
    const tier = tiers.find(t => t.id === values.tierId);
    const data: ApplicationFormData = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      gender: values.gender,
      age: values.age,
      tierId: values.tierId,
      reason: values.reason,
      tierName: tier?.name || '',
      customAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
    };
    const success = await submitApplication(data, user.uid);
    if (success) {
      const app = await getUserApplication(user.uid);
      setExistingApp(app);
    }
    setSubmitting(false);
  };

  if (checkingExisting) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (existingApp) {
    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Application Pending' },
      approved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Application Approved!' },
      rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Application Not Selected' },
    };
    const config = statusConfig[existingApp.status];
    const Icon = config.icon;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-border ${config.bg}`}>
          <CardContent className="py-8 text-center space-y-3">
            <Icon className={`w-12 h-12 mx-auto ${config.color}`} />
            <h3 className="text-xl font-display font-bold text-foreground">{config.label}</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {existingApp.status === 'pending' && 'Your application is being reviewed. We\'ll notify you once a decision is made.'}
              {existingApp.status === 'approved' && 'Congratulations! You can now proceed to purchase your ticket below.'}
              {existingApp.status === 'rejected' && 'We hope to see you at future events. Stay tuned!'}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Filter tiers that have gender-based quotas to show availability
  const availableTiers = tiers.filter(t => t.isActive);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-display">Apply to Join</CardTitle>
          <p className="text-sm text-muted-foreground">
            This is an invite-only event. Fill out the form below to apply for a spot.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input {...form.register('name')} placeholder="Your full name" className="bg-muted" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input {...form.register('email')} type="email" placeholder="your@email.com" className="bg-muted" />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input {...form.register('phone')} placeholder="+91 9876543210" className="bg-muted" />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select onValueChange={(v) => form.setValue('gender', v as GenderCategory)} value={form.watch('gender')}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="text-xs text-destructive">{form.formState.errors.gender.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Age *</Label>
                <Input
                  type="number"
                  {...form.register('age', { valueAsNumber: true })}
                  placeholder="25"
                  className="bg-muted"
                />
                {form.formState.errors.age && (
                  <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ticket Type *</Label>
              <Select onValueChange={(v) => form.setValue('tierId', v)} value={form.watch('tierId')}>
                <SelectTrigger className="bg-muted">
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTiers.map(tier => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name} {tier.price > 0 ? `— ${tier.price}` : '— Free'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.tierId && (
                <p className="text-xs text-destructive">{form.formState.errors.tierId.message}</p>
              )}
            </div>

            {/* Dynamic custom questions */}
            {customQuestions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label>{q.label} {q.required && '*'}</Label>
                {q.type === 'select' && q.options ? (
                  <Select
                    onValueChange={(v) => setCustomAnswers(prev => ({ ...prev, [q.id]: v }))}
                    value={customAnswers[q.id] || ''}
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={customAnswers[q.id] || ''}
                    onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={`Enter your answer`}
                    className="bg-muted"
                  />
                )}
              </div>
            ))}

            <div className="space-y-2">
              <Label>Why do you want to join this event? *</Label>
              <Textarea
                {...form.register('reason')}
                placeholder="Tell us why you'd like to attend..."
                className="bg-muted min-h-24"
              />
              {form.formState.errors.reason && (
                <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
              )}
            </div>

            <Button type="submit" variant="hero" className="w-full" disabled={submitting || !user}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>

            {!user && (
              <p className="text-xs text-muted-foreground text-center">
                You need to sign in to apply for this event.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EventApplicationForm;
