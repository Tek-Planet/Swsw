import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Plus, Ticket } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTickets, useSubmitContactQuery } from '@/hooks/useContactQueries';
import type { ContactQuery } from '@/hooks/useContactQueries';
import TicketConversation from '@/components/TicketConversation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const SupportTickets = () => {
  const { user, loading: authLoading } = useAuth();
  const { tickets, loading } = useMyTickets();
  const { submitQuery, isSubmitting } = useSubmitContactQuery();
  const [selectedTicket, setSelectedTicket] = useState<ContactQuery | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);

  if (authLoading) return <LoadingSpinner size="lg" text="Loading..." />;
  if (!user) return <Navigate to="/auth" replace />;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    const ticketId = await submitQuery({
      subject: newSubject,
      message: newMessage,
      files: newFiles.length > 0 ? newFiles : undefined,
    });
    if (ticketId) {
      toast.success('Ticket created!');
      setShowNewTicket(false);
      setNewSubject('');
      setNewMessage('');
      setNewFiles([]);
    } else {
      toast.error('Failed to create ticket');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Support Tickets</h1>
              <p className="text-muted-foreground text-sm mt-1">Track and manage your support requests</p>
            </div>
            <Button onClick={() => setShowNewTicket(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Ticket
            </Button>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Loading tickets..." />
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground mb-4">No support tickets yet</p>
              <Button variant="outline" onClick={() => setShowNewTicket(true)}>Create your first ticket</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  whileHover={{ scale: 1.01 }}
                  className="glass rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-medium truncate">{ticket.subject}</h3>
                      </div>
                      {ticket.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">{ticket.lastMessage}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(ticket.createdAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusColors[ticket.status]}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* View Ticket Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Support Ticket</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="flex-1 overflow-hidden">
                <TicketConversation
                  ticket={selectedTicket}
                  senderRole="client"
                  onStatusChange={() => {
                    // Ticket list updates via real-time listener
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* New Ticket Dialog */}
        <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="bg-muted/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  className="bg-muted/50 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Attachments (optional)</label>
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
                  className="bg-muted/50"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default SupportTickets;
