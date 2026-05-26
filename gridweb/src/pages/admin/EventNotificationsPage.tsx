import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useEventNotifications } from "@/hooks/useEventNotifications";

export function EventNotificationsPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { notifications, loading: loadingNotifications, createNotification, deleteNotification } = useEventNotifications(eventId);
    
    const [event, setEvent] = useState<any | null>(null);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        const fetchEvent = async () => {
            const eventDocRef = doc(db, "events", eventId);
            const eventDoc = await getDoc(eventDocRef);
            if (eventDoc.exists()) {
                setEvent({ id: eventDoc.id, ...eventDoc.data() });
            } else {
                toast.error("Event not found.");
                navigate("/admin/events");
            }
        };
        fetchEvent();
    }, [eventId, navigate]);

    const handleSendNotification = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error("Please provide a title and a message for the notification.");
            return;
        }

        setIsSending(true);
        try {
            await createNotification(title, message);
            setTitle("");
            setMessage("");
        } catch (error) {
            console.error("Failed to send notification from component", error);
            // The hook already shows a toast on error
        } finally {
            setIsSending(false);
        }
    };

    const formatTimestamp = (timestamp: Timestamp) => {
        if (!timestamp) return "Sending...";
        return new Date(timestamp.toDate()).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
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
                        Event Notifications
                    </h1>
                </div>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Compose Notification</CardTitle>
                    <CardDescription>
                        This will send a push notification and an in-app message to every user who has a paid ticket for this event.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Important Update"
                            className="bg-input"
                            disabled={isSending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="e.g., The event location has changed. We are now at..."
                            className="bg-input"
                            rows={5}
                            disabled={isSending}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSendNotification} disabled={isSending || !title.trim() || !message.trim()} className="gap-2 w-full sm:w-auto">
                           {isSending ? "Sending..." : "Send Notification"}
                           <Send className="h-4 w-4"/>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Sent Notifications</CardTitle>
                    <CardDescription>
                        A log of all notifications sent for this event.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingNotifications ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner text="Loading notifications..."/>
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">No notifications have been sent for this event yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map(notif => (
                                <div key={notif.id} className="p-4 rounded-lg border bg-background/50">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-foreground">{notif.title}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <p className="text-xs text-muted-foreground/80 whitespace-nowrap">{formatTimestamp(notif.sentAt)}</p>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(notif.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
