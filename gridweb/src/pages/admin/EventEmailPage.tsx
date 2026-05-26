
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Event } from '@/types';

const EventEmailPage = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const functions = getFunctions();
    const sendEmailToAttendees = httpsCallable(functions, 'sendEmailToAttendees');

    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId) return;
            setIsLoading(true);
            try {
                const eventDoc = await getDoc(doc(db, 'events', eventId));
                if (eventDoc.exists()) {
                    setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
                } else {
                    toast.error('Event not found.');
                    navigate("/admin/events");
                }
            } catch (error) {
                console.error("Error fetching event:", error);
                toast.error('Could not fetch event details.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvent();
    }, [eventId, navigate]);

    const handleSendEmail = async () => {
        if (!subject.trim() || !body.trim()) {
            toast.error('Please fill in both subject and email body.');
            return;
        }

        if (!eventId) {
            toast.error('Event ID is missing.');
            return;
        }

        setIsSending(true);
        try {
            await sendEmailToAttendees({ eventId, subject, htmlBody: body });
            toast.success('Email campaign started!', {
                description: `Emails are being sent to all attendees of ${event?.title}.`,
            });
            setSubject('');
            setBody('');
        } catch (error: any) {
            console.error("Error sending email:", error);
            toast.error('Error Sending Email', {
                description: error.message || 'An unexpected error occurred. Please try again.'
            });
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><LoadingSpinner text="Loading event details..." /></div>;
    }

    return (
        <div className="space-y-6 pb-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(`/admin/events/${eventId}`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <p className="text-sm text-muted-foreground">Back to {event?.title || "Event"}</p>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                        Compose Email
                    </h1>
                </div>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Audience: All Attendees</CardTitle>
                    <CardDescription>
                        This will send an email to every user who has a paid ticket for this event.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Important Update for the event"
                            className="bg-input"
                            disabled={isSending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="body">Email Body</Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Compose your email here. You can use basic HTML for formatting."
                            className="bg-input"
                            rows={12}
                            disabled={isSending}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSendEmail} disabled={isSending || !subject.trim() || !body.trim()} className="gap-2 w-full sm:w-auto">
                           {isSending ? 'Sending...' : 'Send Email'}
                           <Send className="h-4 w-4"/>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EventEmailPage;
