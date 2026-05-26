import { useState } from 'react';
import { useContactQueries } from '@/hooks/useContactQueries';
import type { ContactQuery } from '@/hooks/useContactQueries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Filter } from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';
import TicketConversation from '@/components/TicketConversation';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const AdminQueries = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { queries, loading, refetch } = useContactQueries(statusFilter);
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading queries..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">{queries.length} tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {queries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>No tickets found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Subject</TableHead>
                <TableHead className="hidden sm:table-cell">User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queries.map((q) => (
                <TableRow key={q.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedQuery(q)}>
                  <TableCell className="font-medium max-w-[200px] truncate">{q.subject}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{q.userName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[q.status]}>
                      {q.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {format(q.createdAt, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedQuery(q); }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Ticket Conversation Dialog */}
      <Dialog open={!!selectedQuery} onOpenChange={(open) => !open && setSelectedQuery(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Support Ticket</DialogTitle>
          </DialogHeader>
          {selectedQuery && (
            <div className="flex-1 overflow-hidden">
              <TicketConversation
                ticket={selectedQuery}
                senderRole="admin"
                onStatusChange={() => refetch()}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQueries;
