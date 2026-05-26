import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, GripVertical, Upload, X, Loader2, Ticket, ShieldCheck, MessageSquarePlus } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { EventFormData, TicketTierFormData } from '@/hooks/useEventMutations';
import { CustomQuestion } from '@/types';
import { uploadEventImage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Validation schema
const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  subtitle: z.string().max(150, 'Subtitle must be less than 150 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
  coverImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  startDate: z.date({ required_error: 'Start date is required' }),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.date().optional(),
  endTime: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  visibility: z.enum(['public', 'private', 'unlisted']),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']),
  maxAttendees: z.number().min(0).optional().nullable(),
  hostName: z.string().optional(),
  tags: z.string().optional(),
  currency: z.enum(['INR', 'USD', 'HKD', 'SGD']),
  bookingFeePercent: z.number().min(0).max(100).optional().nullable(),
  eventType: z.enum(['regular', 'movie']).optional(),
  venueId: z.string().optional(),
  showtimeDate: z.date().optional(),
  showtimeTime: z.string().optional(),
  movieTitle: z.string().optional(),
  movieDurationMins: z.number().optional().nullable(),
  movieLanguage: z.string().optional(),
  movieRating: z.string().optional(),
  movieSynopsis: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  eventId?: string; // Required for edit mode promo codes
  initialData?: EventFormData;
  initialTiers?: TicketTierFormData[];
  onSubmit: (data: EventFormData, tiers: TicketTierFormData[]) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const defaultTier: Omit<TicketTierFormData, 'sortOrder'> = {
  name: '',
  description: '',
  price: 0,
  currency: 'inr',
  type: 'ticket',
  isActive: true,
  quantityTotal: undefined,
  chargeAmount: undefined,
};

// Promo code interface
interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed' | 'free';
  discountValue: number;
  maxRedemptions: number;
  currentRedemptions: number;
  isActive: boolean;
  waiveProcessingFee: boolean;
  eventId?: string;
  applicableTierIds?: string[];
}

const defaultPromoCode: Omit<PromoCode, 'id'> = {
  code: '',
  discountType: 'percent',
  discountValue: 0,
  maxRedemptions: 100,
  currentRedemptions: 0,
  isActive: true,
  waiveProcessingFee: false,
  applicableTierIds: [],
};

export const EventForm = ({
  eventId,
  initialData,
  initialTiers = [],
  onSubmit,
  isLoading = false,
  mode,
}: EventFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTierFormData[]>(
    initialTiers.length > 0 ? initialTiers : []
  );
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(initialData?.coverImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('details');
  
  // Promo codes state
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [newPromoCode, setNewPromoCode] = useState<Omit<PromoCode, 'id'> | null>(null);

  // Invite-only state
  const [isInviteOnly, setIsInviteOnly] = useState(initialData?.isInviteOnly || false);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(
    initialData?.customQuestions || []
  );

  // Fetch promo codes for this event (in edit mode)
  useEffect(() => {
    const fetchPromoCodes = async () => {
      if (mode === 'edit' && eventId) {
        setPromoLoading(true);
        try {
          const promoQuery = query(
            collection(db, 'promoCodes'),
            where('eventId', '==', eventId)
          );
          const snapshot = await getDocs(promoQuery);
          const codes = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              applicableTierIds: data.applicableTierIds || [],
              waiveProcessingFee: data.waiveProcessingFee === true, // Ensure boolean
            } as PromoCode;
          });
          setPromoCodes(codes);
        } catch (error) {
          console.error('Error fetching promo codes:', error);
        } finally {
          setPromoLoading(false);
        }
      }
    };
    fetchPromoCodes();
  }, [mode, eventId]);

  // Parse initial dates
  const getInitialValues = (): EventFormValues => {
    if (initialData) {
      const startDate = new Date(initialData.startTime);
      const endDate = initialData.endTime ? new Date(initialData.endTime) : undefined;
      
      return {
        title: initialData.title,
        subtitle: initialData.subtitle || '',
        description: initialData.description,
        coverImageUrl: initialData.coverImageUrl || '',
        startDate,
        startTime: format(startDate, 'HH:mm'),
        endDate,
        endTime: endDate ? format(endDate, 'HH:mm') : '',
        address: initialData.location.address,
        city: initialData.location.city,
        visibility: initialData.visibility || 'public',
        status: initialData.status,
        maxAttendees: initialData.maxAttendees || null,
        hostName: initialData.hostName || '',
        tags: initialData.tags?.join(', ') || '',
        currency: initialData.currency || 'INR',
        bookingFeePercent: initialData.bookingFeePercent ?? 10,
        eventType: initialData.eventType || 'regular',
        venueId: initialData.venueId || 'house6',
        showtimeDate: initialData.showtime ? new Date(initialData.showtime) : undefined,
        showtimeTime: initialData.showtime ? format(new Date(initialData.showtime), 'HH:mm') : '',
        movieTitle: initialData.movie?.title || '',
        movieDurationMins: initialData.movie?.durationMins ?? null,
        movieLanguage: initialData.movie?.language || '',
        movieRating: initialData.movie?.rating || '',
        movieSynopsis: initialData.movie?.synopsis || '',
      };
    }

    return {
      title: '',
      subtitle: '',
      description: '',
      coverImageUrl: '',
      startDate: new Date(),
      startTime: '21:00',
      endDate: undefined,
      endTime: '',
      address: '',
      city: '',
      visibility: 'public',
      status: 'draft',
      maxAttendees: null,
      hostName: '',
      tags: '',
      currency: 'INR',
      bookingFeePercent: 10,
      eventType: 'regular',
      venueId: 'house6',
      showtimeDate: undefined,
      showtimeTime: '',
      movieTitle: '',
      movieDurationMins: null,
      movieLanguage: '',
      movieRating: '',
      movieSynopsis: '',
    };
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getInitialValues(),
  });

  const isMovie = form.watch('eventType') === 'movie';
  const movieTitle = form.watch('movieTitle');
  const movieSynopsis = form.watch('movieSynopsis');
  const movieDuration = form.watch('movieDurationMins');
  const showtimeDate = form.watch('showtimeDate');
  const showtimeTime = form.watch('showtimeTime');
  const venueId = form.watch('venueId');

  // Venue presets (Phase 1: House 6 only)
  const VENUE_PRESETS: Record<string, { address: string; city: string; currency: 'INR' | 'USD' | 'HKD' | 'SGD' }> = {
    house6: { address: 'House 6 Cinema', city: 'Hong Kong', currency: 'HKD' },
  };

  // Auto-sync core event fields from movie panel when type === 'movie'
  useEffect(() => {
    if (!isMovie) return;
    if (movieTitle !== undefined) form.setValue('title', movieTitle || '');
    if (movieSynopsis !== undefined) {
      const syn = (movieSynopsis || '').trim();
      // Description must be >= 10 chars; fall back to a default
      form.setValue('description', syn.length >= 10 ? syn : `${movieTitle || 'Movie'} — screening at House 6.`);
    }
    if (showtimeDate) form.setValue('startDate', showtimeDate);
    if (showtimeTime) form.setValue('startTime', showtimeTime);
    if (showtimeDate && showtimeTime && movieDuration) {
      const end = new Date(showtimeDate);
      const [h, m] = showtimeTime.split(':').map(Number);
      end.setHours(h, m + movieDuration, 0, 0);
      form.setValue('endDate', end);
      form.setValue('endTime', format(end, 'HH:mm'));
    }
    const preset = VENUE_PRESETS[venueId || 'house6'];
    if (preset) {
      form.setValue('address', preset.address);
      form.setValue('city', preset.city);
      form.setValue('currency', preset.currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMovie, movieTitle, movieSynopsis, movieDuration, showtimeDate, showtimeTime, venueId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    form.setValue('coverImageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (values: EventFormValues) => {
    // Upload image if a new file was selected
    let coverImageUrl = values.coverImageUrl || undefined;
    
    if (coverImageFile) {
      setIsUploading(true);
      setUploadProgress(0);
      const uploadedUrl = await uploadEventImage(coverImageFile, eventId, (progress) => {
        setUploadProgress(progress);
      });
      setIsUploading(false);
      setUploadProgress(0);
      
      if (!uploadedUrl) {
        toast({
          title: 'Upload failed',
          description: 'Failed to upload cover image. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      coverImageUrl = uploadedUrl;
    }

    // Combine date and time
    const startDateTime = new Date(values.startDate);
    const [startHours, startMinutes] = values.startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    let endDateTime: Date | undefined;
    if (values.endDate && values.endTime) {
      endDateTime = new Date(values.endDate);
      const [endHours, endMinutes] = values.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
    }

    let showtime: Date | undefined;
    if (values.eventType === 'movie' && values.showtimeDate && values.showtimeTime) {
      showtime = new Date(values.showtimeDate);
      const [sh, sm] = values.showtimeTime.split(':').map(Number);
      showtime.setHours(sh, sm, 0, 0);
    }

    const eventData: EventFormData = {
      title: values.title,
      subtitle: values.subtitle || undefined,
      description: values.description,
      coverImageUrl,
      startTime: startDateTime,
      endTime: endDateTime,
      location: {
        address: values.address,
        city: values.city,
      },
      visibility: values.visibility,
      status: values.status,
      maxAttendees: values.maxAttendees || undefined,
      hostName: values.hostName || undefined,
      tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      currency: values.currency,
      bookingFeePercent: values.bookingFeePercent ?? 10,
      isInviteOnly,
      customQuestions: isInviteOnly && customQuestions.length > 0 ? customQuestions : undefined,
      eventType: values.eventType || 'regular',
      venueId: values.eventType === 'movie' ? (values.venueId || 'house6') : undefined,
      showtime,
      movie:
        values.eventType === 'movie'
          ? {
              title: values.movieTitle || values.title,
              durationMins: values.movieDurationMins ?? undefined,
              language: values.movieLanguage || undefined,
              rating: values.movieRating || undefined,
              synopsis: values.movieSynopsis || undefined,
            }
          : undefined,
    };

    await onSubmit(eventData, ticketTiers);
  };

  // Ticket tier handlers
  const addTicketTier = () => {
    setTicketTiers([
      ...ticketTiers,
      { ...defaultTier, sortOrder: ticketTiers.length + 1 },
    ]);
  };

  const updateTicketTier = (index: number, updates: Partial<TicketTierFormData>) => {
    const newTiers = [...ticketTiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    setTicketTiers(newTiers);
  };

  const removeTicketTier = (index: number) => {
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  // Promo code handlers
  const handleAddPromoCode = async () => {
    if (!newPromoCode || !eventId) return;
    
    try {
      const promoData = {
        ...newPromoCode,
        code: newPromoCode.code.trim().toUpperCase(),
        eventId,
        currentRedemptions: 0,
      };
      
      const docRef = await addDoc(collection(db, 'promoCodes'), promoData);
      setPromoCodes([...promoCodes, { id: docRef.id, ...promoData, applicableTierIds: promoData.applicableTierIds || [], waiveProcessingFee: promoData.waiveProcessingFee }]);
      setNewPromoCode(null);
      toast({
        title: 'Promo code created',
        description: `Code "${promoData.code}" has been added.`,
      });
    } catch (error) {
      console.error('Error adding promo code:', error);
      toast({
        title: 'Error',
        description: 'Failed to create promo code.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePromoCode = async (promoId: string, updates: Partial<PromoCode>) => {
    try {
      const promoRef = doc(db, 'promoCodes', promoId);
      await updateDoc(promoRef, updates);
      setPromoCodes(promoCodes.map(p => p.id === promoId ? { ...p, ...updates } : p));
      setEditingPromoId(null);
      toast({
        title: 'Promo code updated',
        description: 'Changes have been saved.',
      });
    } catch (error) {
      console.error('Error updating promo code:', error);
      toast({
        title: 'Error',
        description: 'Failed to update promo code.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePromoCode = async (promoId: string) => {
    try {
      await deleteDoc(doc(db, 'promoCodes', promoId));
      setPromoCodes(promoCodes.filter(p => p.id !== promoId));
      toast({
        title: 'Promo code deleted',
        description: 'The promo code has been removed.',
      });
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete promo code.',
        variant: 'destructive',
      });
    }
  };
  
  const handleApplicableTierChange = (promoId: string, tierId: string, checked: boolean) => {
    setPromoCodes(promoCodes.map(p => {
      if (p.id === promoId) {
        const applicableTierIds = p.applicableTierIds || [];
        if (checked) {
          return { ...p, applicableTierIds: [...applicableTierIds, tierId] };
        } else {
          return { ...p, applicableTierIds: applicableTierIds.filter(id => id !== tierId) };
        }
      }
      return p;
    }));
  };
  
    const handleNewApplicableTierChange = (tierId: string, checked: boolean) => {
    if (newPromoCode) {
      const applicableTierIds = newPromoCode.applicableTierIds || [];
      if (checked) {
        setNewPromoCode({ ...newPromoCode, applicableTierIds: [...applicableTierIds, tierId] });
      } else {
        setNewPromoCode({ ...newPromoCode, applicableTierIds: applicableTierIds.filter(id => id !== tierId) });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn('grid w-full mb-6', isMovie ? 'grid-cols-2' : 'grid-cols-3')}>
            <TabsTrigger value="details">Event Details</TabsTrigger>
            {!isMovie && <TabsTrigger value="tiers">Ticket Tiers</TabsTrigger>}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Event Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Event Type (Movie toggle) */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Event Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select value={field.value || 'regular'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-muted">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="regular">Regular event</SelectItem>
                          <SelectItem value="movie">Movie / Cinema</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Movie events use a seat map (House 6) instead of ticket tiers.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {form.watch('eventType') === 'movie' && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="movieTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Movie Title</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-muted" placeholder="e.g., Dune: Part Two" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="movieDurationMins"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (mins)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                className="bg-muted"
                                placeholder="e.g., 165"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="movieLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-muted" placeholder="e.g., English" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="movieRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rating</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-muted" placeholder="e.g., PG-13" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="movieSynopsis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Synopsis</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="bg-muted min-h-24" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="venueId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue</FormLabel>
                            <Select value={field.value || 'house6'} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="house6">House 6 — Premiere Elements</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="showtimeDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Showtime Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn('w-full pl-3 text-left font-normal bg-muted', !field.value && 'text-muted-foreground')}>
                                    {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="showtimeTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Showtime Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} className="bg-muted" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seats and pricing (Rows B & C HKD 140, others HKD 160) are taken from the venue layout. Ticket Tiers tab is ignored for movie events. Booking fee uses the value in Settings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cover Image Upload - Always visible */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {coverImagePreview ? (
                    <div className="relative">
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                          <span className="text-sm font-medium">{Math.round(uploadProgress)}%</span>
                        </div>
                      )}
                      {!isUploading && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 border-dashed bg-muted hover:bg-muted/80"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-8 w-8" />
                        <span>Click to upload cover image</span>
                        <span className="text-xs">Recommended: 1200x800px, max 5MB</span>
                      </div>
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {coverImageFile ? `Selected: ${coverImageFile.name}` : 'PNG, JPG, or WEBP up to 5MB'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {!isMovie && (<>
            {/* Basic Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Summer Music Festival" {...field} className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ft. DJ Chetas" {...field} className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your event..."
                          className="bg-muted min-h-32 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Markdown is supported. Include details about the event, what to expect, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hostName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Grid Events" {...field} className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., music, nightlife, party" {...field} className="bg-muted" />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of tags
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal bg-muted',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal bg-muted',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const startDate = form.getValues('startDate');
                                return date < startDate;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cavore, Koramangala" {...field} className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bengaluru" {...field} className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            </>)}
          </TabsContent>

          {!isMovie && (
          <TabsContent value="tiers" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Ticket Tiers</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addTicketTier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticketTiers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No ticket tiers added yet.</p>
                    <p className="text-sm">Click "Add Tier" to create ticket options for your event.</p>
                  </div>
                ) : (
                  ticketTiers.map((tier, index) => (
                    <Card key={index} className="bg-muted border-border">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Tier {index + 1}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTicketTier(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={tier.name}
                              onChange={(e) => updateTicketTier(index, { name: e.target.value })}
                              placeholder="e.g., Early Bird"
                              className="bg-background mt-1"
                            />
                          </div>
                          <div>
                            <Label>Type *</Label>
                            <Select
                              value={tier.type}
                              onValueChange={(value:any) =>
                                updateTicketTier(index, { type: value })
                              }
                            >
                              <SelectTrigger className="bg-background mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ticket">Ticket</SelectItem>
                                <SelectItem value="addon">Add-on</SelectItem>
                                <SelectItem value="table">Table</SelectItem>
                                <SelectItem value="donation">Donation</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={tier.description}
                            onChange={(e) => updateTicketTier(index, { description: e.target.value })}
                            placeholder="Describe what's included..."
                            className="bg-background mt-1 min-h-20"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Price (₹) *</Label>
                            <Input
                              type="number"
                              value={tier.price}
                              onChange={(e) => updateTicketTier(index, { price: parseFloat(e.target.value) || 0 })}
                              placeholder="0"
                              className="bg-background mt-1"
                            />
                          </div>
                          {tier.type === 'table' && (
                            <div>
                              <Label>Deposit Amount (₹)</Label>
                              <Input
                                type="number"
                                value={tier.chargeAmount || ''}
                                onChange={(e) => updateTicketTier(index, { 
                                  chargeAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                                })}
                                placeholder="Amount to charge now"
                                className="bg-background mt-1"
                              />
                            </div>
                          )}
                          <div>
                            <Label>Total Quantity</Label>
                            <Input
                              type="number"
                              value={tier.quantityTotal || ''}
                              onChange={(e) => updateTicketTier(index, { 
                                quantityTotal: e.target.value ? parseInt(e.target.value) : undefined 
                              })}
                              placeholder="Unlimited"
                              className="bg-background mt-1"
                            />
                          </div>
                        </div>

                        {/* Gender Quotas (for invite-only events) */}
                        {isInviteOnly && (
                          <div className="space-y-3 border-t border-border pt-3">
                            <Label className="text-sm font-medium">Gender Quotas</Label>
                            <p className="text-xs text-muted-foreground">
                              Set capacity limits per gender for this tier. Leave empty for no restriction.
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Male</Label>
                                <Input
                                  type="number"
                                  value={tier.genderQuotas?.male || ''}
                                  onChange={(e) => updateTicketTier(index, {
                                    genderQuotas: {
                                      male: e.target.value ? parseInt(e.target.value) : 0,
                                      female: tier.genderQuotas?.female || 0,
                                      other: tier.genderQuotas?.other || 0,
                                    },
                                  })}
                                  placeholder="0"
                                  className="bg-background mt-1"
                                  min={0}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Female</Label>
                                <Input
                                  type="number"
                                  value={tier.genderQuotas?.female || ''}
                                  onChange={(e) => updateTicketTier(index, {
                                    genderQuotas: {
                                      male: tier.genderQuotas?.male || 0,
                                      female: e.target.value ? parseInt(e.target.value) : 0,
                                      other: tier.genderQuotas?.other || 0,
                                    },
                                  })}
                                  placeholder="0"
                                  className="bg-background mt-1"
                                  min={0}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Other</Label>
                                <Input
                                  type="number"
                                  value={tier.genderQuotas?.other || ''}
                                  onChange={(e) => updateTicketTier(index, {
                                    genderQuotas: {
                                      male: tier.genderQuotas?.male || 0,
                                      female: tier.genderQuotas?.female || 0,
                                      other: e.target.value ? parseInt(e.target.value) : 0,
                                    },
                                  })}
                                  placeholder="0"
                                  className="bg-background mt-1"
                                  min={0}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`tier-active-${index}`}
                            checked={tier.isActive}
                            onCheckedChange={(checked) => updateTicketTier(index, { isActive: checked })}
                          />
                          <Label htmlFor={`tier-active-${index}`}>Active</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Event Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-muted">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-muted">
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!isMovie && (
                <FormField
                  control={form.control}
                  name="maxAttendees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Attendees</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Leave empty for unlimited"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for unlimited capacity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}
              </CardContent>
            </Card>

            {!isMovie && (<>
            {/* Invite Only Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Invite Only
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Invite Only Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must apply and be approved before purchasing tickets
                    </p>
                  </div>
                  <Switch
                    checked={isInviteOnly}
                    onCheckedChange={setIsInviteOnly}
                  />
                </div>

                {isInviteOnly && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <MessageSquarePlus className="h-4 w-4" />
                        Custom Questions
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomQuestions([
                          ...customQuestions,
                          { id: crypto.randomUUID(), label: '', type: 'text', required: false },
                        ])}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Question
                      </Button>
                    </div>

                    {customQuestions.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No custom questions. The default fields (name, gender, age, phone, reason) are always included.
                      </p>
                    )}

                    {customQuestions.map((q, idx) => (
                      <div key={q.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <Label className="text-xs">Question Label</Label>
                              <Input
                                value={q.label}
                                onChange={(e) => {
                                  const updated = [...customQuestions];
                                  updated[idx] = { ...updated[idx], label: e.target.value };
                                  setCustomQuestions(updated);
                                }}
                                placeholder="e.g., Favorite badminton shot"
                                className="bg-background mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={q.type}
                                onValueChange={(v: 'text' | 'select') => {
                                  const updated = [...customQuestions];
                                  updated[idx] = { ...updated[idx], type: v };
                                  setCustomQuestions(updated);
                                }}
                              >
                                <SelectTrigger className="bg-background mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="select">Dropdown</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {q.type === 'select' && (
                            <div>
                              <Label className="text-xs">Options (comma-separated)</Label>
                              <Input
                                defaultValue={q.options?.join(', ') || ''}
                                onBlur={(e) => {
                                  const updated = [...customQuestions];
                                  updated[idx] = {
                                    ...updated[idx],
                                    options: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                  };
                                  setCustomQuestions(updated);
                                }}
                                placeholder="e.g., Drop shot, Smash, Net play"
                                className="bg-background mt-1"
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={q.required || false}
                              onCheckedChange={(checked) => {
                                const updated = [...customQuestions];
                                updated[idx] = { ...updated[idx], required: checked };
                                setCustomQuestions(updated);
                              }}
                              id={`q-required-${idx}`}
                            />
                            <Label htmlFor={`q-required-${idx}`} className="text-xs">Required</Label>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => setCustomQuestions(customQuestions.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </>)}

            {/* (currency/fee card follows) */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Pricing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-muted">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                            <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                            <SelectItem value="HKD">$ HKD (Hong Kong Dollar)</SelectItem>
                            <SelectItem value="SGD">$ SGD (Singapore Dollar)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Currency for ticket prices
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bookingFeePercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Fee (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            className="bg-muted"
                            min={0}
                            max={100}
                            step={0.5}
                          />
                        </FormControl>
                        <FormDescription>
                          Processing fee percentage (default: 10%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Promo Codes Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Promo Codes
                  </CardTitle>
                  {mode === 'edit' && eventId && !newPromoCode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewPromoCode({ ...defaultPromoCode })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Code
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode === 'create' ? (
                  <p className="text-sm text-muted-foreground">
                    Save the event first to add promo codes.
                  </p>
                ) : promoLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* New Promo Code Form */}
                    {newPromoCode && (
                      <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Code *</Label>
                            <Input
                              placeholder="e.g., SUMMER20"
                              value={newPromoCode.code}
                              onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value })}
                              className="bg-background uppercase"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Discount Type *</Label>
                            <Select
                              value={newPromoCode.discountType}
                              onValueChange={(v: 'percent' | 'fixed' | 'free') => 
                                setNewPromoCode({ ...newPromoCode, discountType: v, discountValue: v === 'free' ? 0 : newPromoCode.discountValue })
                              }
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percent">Percentage Off</SelectItem>
                                <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                                <SelectItem value="free">100% Free</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {newPromoCode.discountType !== 'free' && (
                            <div className="space-y-2">
                              <Label>Discount Value *</Label>
                              <Input
                                type="number"
                                placeholder={newPromoCode.discountType === 'percent' ? '20' : '100'}
                                value={newPromoCode.discountValue || ''}
                                onChange={(e) => setNewPromoCode({ ...newPromoCode, discountValue: parseFloat(e.target.value) || 0 })}
                                className="bg-background"
                                min={0}
                                max={newPromoCode.discountType === 'percent' ? 100 : undefined}
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Max Redemptions</Label>
                            <Input
                              type="number"
                              placeholder="100"
                              value={newPromoCode.maxRedemptions || ''}
                              onChange={(e) => setNewPromoCode({ ...newPromoCode, maxRedemptions: parseInt(e.target.value) || 0 })}
                              className="bg-background"
                              min={1}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Applicable Tiers</Label>
                          <div className="space-y-2">
                            {ticketTiers.map((tier) => (
                              <div key={tier.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`new-promo-tier-${tier.id}`}
                                  checked={newPromoCode.applicableTierIds?.includes(tier.id!)}
                                  onCheckedChange={(checked) => handleNewApplicableTierChange(tier.id!, !!checked)}
                                />
                                <label htmlFor={`new-promo-tier-${tier.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {tier.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <Switch
                            id="new-promo-waive-fee"
                            checked={newPromoCode.waiveProcessingFee}
                            onCheckedChange={(checked) => setNewPromoCode({ ...newPromoCode, waiveProcessingFee: checked })}
                          />
                          <Label htmlFor="new-promo-waive-fee">Waive Processing Fee</Label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={newPromoCode.isActive}
                              onCheckedChange={(checked) => setNewPromoCode({ ...newPromoCode, isActive: checked })}
                            />
                            <Label>Active</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setNewPromoCode(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddPromoCode}
                              disabled={!newPromoCode.code.trim()}
                            >
                              Save Code
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Existing Promo Codes */}
                    {promoCodes.length === 0 && !newPromoCode ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No promo codes yet. Click "Add Code" to create one.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {promoCodes.map((promo) => (
                          <div
                            key={promo.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
                          >
                            {editingPromoId === promo.id ? (
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <Input
                                    value={promo.code}
                                    onChange={(e) => setPromoCodes(promoCodes.map(p => 
                                      p.id === promo.id ? { ...p, code: e.target.value.toUpperCase() } : p
                                    ))}
                                    className="bg-background uppercase"
                                  />
                                  <Select
                                    value={promo.discountType}
                                    onValueChange={(v: 'percent' | 'fixed' | 'free') => 
                                      setPromoCodes(promoCodes.map(p => 
                                        p.id === promo.id ? { ...p, discountType: v } : p
                                      ))
                                    }
                                  >
                                    <SelectTrigger className="bg-background">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="percent">Percent</SelectItem>
                                      <SelectItem value="fixed">Fixed</SelectItem>
                                      <SelectItem value="free">Free</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {promo.discountType !== 'free' && (
                                    <Input
                                      type="number"
                                      value={promo.discountValue || ''}
                                      onChange={(e) => setPromoCodes(promoCodes.map(p => 
                                        p.id === promo.id ? { ...p, discountValue: parseFloat(e.target.value) || 0 } : p
                                      ))}
                                      className="bg-background"
                                    />
                                  )}
                                  <Input
                                    type="number"
                                    value={promo.maxRedemptions || ''}
                                    onChange={(e) => setPromoCodes(promoCodes.map(p => 
                                      p.id === promo.id ? { ...p, maxRedemptions: parseInt(e.target.value) || 0 } : p
                                    ))}
                                    className="bg-background"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Applicable Tiers</Label>
                                  <div className="space-y-2">
                                    {ticketTiers.map((tier) => (
                                      <div key={tier.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`promo-tier-${promo.id}-${tier.id}`}
                                          checked={(promo.applicableTierIds || []).includes(tier.id!)}
                                          onCheckedChange={(checked) => handleApplicableTierChange(promo.id, tier.id!, !!checked)}
                                        />
                                        <label htmlFor={`promo-tier-${promo.id}-${tier.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                          {tier.name}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                  <Switch
                                    id={`promo-waive-fee-${promo.id}`}
                                    checked={promo.waiveProcessingFee}
                                    onCheckedChange={(checked) => setPromoCodes(promoCodes.map(p => 
                                      p.id === promo.id ? { ...p, waiveProcessingFee: checked } : p
                                    ))}
                                  />
                                  <Label htmlFor={`promo-waive-fee-${promo.id}`}>Waive Processing Fee</Label>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={promo.isActive}
                                      onCheckedChange={(checked) => setPromoCodes(promoCodes.map(p => 
                                        p.id === promo.id ? { ...p, isActive: checked } : p
                                      ))}
                                    />
                                    <Label className="text-sm">Active</Label>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingPromoId(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => handleUpdatePromoCode(promo.id, {
                                        code: promo.code,
                                        discountType: promo.discountType,
                                        discountValue: promo.discountValue,
                                        maxRedemptions: promo.maxRedemptions,
                                        isActive: promo.isActive,
                                        applicableTierIds: promo.applicableTierIds,
                                        waiveProcessingFee: promo.waiveProcessingFee,
                                      })}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="font-mono font-medium">{promo.code}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {promo.discountType === 'free' 
                                        ? '100% Free' 
                                        : promo.discountType === 'percent'
                                          ? `${promo.discountValue}% off`
                                          : `${promo.discountValue} off`}
                                      {' · '}
                                      {promo.currentRedemptions}/{promo.maxRedemptions} used
                                    </p>
                                     <p className="text-xs text-muted-foreground">
                                      Applies to: {promo.applicableTierIds && promo.applicableTierIds.length > 0 ? (
                                        promo.applicableTierIds.map(tierId => ticketTiers.find(t => t.id === tierId)?.name || tierId).join(', ')
                                      ) : (
                                        'All Tiers'
                                      )}
                                      
                                    </p>
                                  </div>
                                  <div className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    promo.isActive 
                                      ? "bg-green-500/20 text-green-400" 
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    {promo.isActive ? 'Active' : 'Inactive'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingPromoId(promo.id)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeletePromoCode(promo.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || isUploading} className="flex-1 md:flex-none md:min-w-40">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading image...
              </>
            ) : isLoading ? (
              'Saving...'
            ) : mode === 'create' ? (
              'Create Event'
            ) : (
              'Update Event'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
