import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Paperclip, X, FileText, Image, Download, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTicketMessages, useSendTicketReply, useResolveTicket } from '@/hooks/useContactQueries';
import type { ContactQuery, TicketAttachment } from '@/hooks/useContactQueries';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';

interface TicketConversationProps {
  ticket: ContactQuery;
  senderRole: 'client' | 'admin';
  onStatusChange?: () => void;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const AttachmentPreview = ({ attachment }: { attachment: TicketAttachment }) => {
  const isImage = attachment.type.startsWith('image/');
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
    >
      {isImage ? (
        <Image className="w-4 h-4 text-primary shrink-0" />
      ) : (
        <FileText className="w-4 h-4 text-primary shrink-0" />
      )}
      <span className="truncate max-w-[150px]">{attachment.name}</span>
      <Download className="w-3 h-3 text-muted-foreground shrink-0" />
    </a>
  );
};

const TicketConversation = ({ ticket, senderRole, onStatusChange }: TicketConversationProps) => {
  const { messages, loading } = useTicketMessages(ticket.id);
  const { sendReply, isSending } = useSendTicketReply();
  const { resolveTicket, reopenTicket, isResolving } = useResolveTicket();
  const [replyText, setReplyText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!replyText.trim() && files.length === 0) return;
    const success = await sendReply({
      ticketId: ticket.id,
      message: replyText.trim(),
      senderRole,
      files: files.length > 0 ? files : undefined,
    });
    if (success) {
      setReplyText('');
      setFiles([]);
    } else {
      toast.error('Failed to send reply');
    }
  };

  const handleResolve = async () => {
    const success = await resolveTicket(ticket.id, senderRole);
    if (success) {
      toast.success('Ticket marked as resolved');
      onStatusChange?.();
    }
  };

  const handleReopen = async () => {
    const success = await reopenTicket(ticket.id);
    if (success) {
      toast.success('Ticket reopened');
      onStatusChange?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) return <LoadingSpinner size="md" text="Loading messages..." />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{ticket.subject}</h3>
          <p className="text-xs text-muted-foreground">
            {senderRole === 'admin' ? `${ticket.userName} (${ticket.userEmail})` : `Opened ${format(ticket.createdAt, 'MMM d, yyyy')}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={statusColors[ticket.status]}>
            {ticket.status.replace('_', ' ')}
          </Badge>
          {ticket.status !== 'resolved' ? (
            <Button size="sm" variant="outline" onClick={handleResolve} disabled={isResolving} className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handleReopen} disabled={isResolving} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Reopen
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[200px] max-h-[400px]">
        {messages.map((msg) => {
          const isOwnSide = msg.senderRole === senderRole;
          return (
            <div key={msg.id} className={`flex ${isOwnSide ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                isOwnSide
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted rounded-bl-md'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-80">{msg.senderName}</span>
                  <span className="text-xs opacity-50">{format(msg.createdAt, 'HH:mm')}</span>
                </div>
                {msg.message && (
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                )}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.attachments.map((att, i) => (
                      <AttachmentPreview key={i} attachment={att} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      {ticket.status !== 'resolved' && (
        <div className="pt-4 border-t border-border space-y-3">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={2}
                className="resize-none pr-10"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
              className="shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || (!replyText.trim() && files.length === 0)}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line. Max {MAX_FILES} files, 10MB each.
          </p>
        </div>
      )}
    </div>
  );
};

export default TicketConversation;
