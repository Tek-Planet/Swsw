import { useState, useEffect, useMemo } from 'react';
import { Timestamp, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, Download, User, Mail, Phone, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminOrders, useAdminEvents } from '@/hooks/useAdminData';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Order, Event } from '@/types';
import { getFunctions, httpsCallable } from 'firebase/functions';

const ITEMS_PER_PAGE = 10;

interface UserProfile {
  userId: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoUrl?: string;
  createdAt?: Timestamp;
}

const Bookings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { orders: bookings, loading, refetch } = useAdminOrders();
  const { events } = useAdminEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Order | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const manuallyFulfillOrder = httpsCallable(getFunctions(), 'manuallyFulfillOrder');

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string, newStatus: 'paid' | 'pending' }) => {
      if (newStatus === 'paid') {
        // Call the new Cloud Function to handle fulfillment
        return manuallyFulfillOrder({ orderId });
      } else {
        // For other status updates, update the doc directly
        const orderRef = doc(db, 'orders', orderId);
        return updateDoc(orderRef, { status: newStatus });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: variables.newStatus === 'paid' ? 'Order Fulfilled' : 'Booking status updated',
        description: variables.newStatus === 'paid'
          ? `Booking has been fulfilled and marked as paid.`
          : `Booking has been marked as ${variables.newStatus}.`,
      });
    },
    onError: (error) => {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleUpdateStatus = (orderId: string, newStatus: 'paid' | 'pending') => {
    updateStatusMutation.mutate({ orderId, newStatus });
  };
  
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.userId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesEvent = eventFilter === 'all' || booking.eventId === eventFilter;
      
      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [bookings, searchQuery, statusFilter, eventFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, eventFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const formatPrice = (amount: number, currency: string = 'INR') => {
    const locale = currency === 'USD' ? 'en-US' : currency === 'HKD' ? 'en-HK' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp?.toDate?.() || new Date();
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp?.toDate?.() || new Date();
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-500/10 text-green-500 border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      canceled: 'bg-red-500/10 text-red-500 border-red-500/20',
      failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const totalRevenue = bookings
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.subtotal, 0);

  const handleViewProfile = async (booking: Order) => {
    setSelectedBooking(booking);
    setProfileLoading(true);
    
    try {
      // Try to fetch user profile from users collection
      const userDoc = await getDoc(doc(db, 'users', booking.userId));
      if (userDoc.exists()) {
        setUserProfile({
          userId: booking.userId,
          ...userDoc.data(),
        } as UserProfile);
      } else {
        // Fallback to basic info from order
        setUserProfile({
          userId: booking.userId,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile({
        userId: booking.userId,
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfileDialog = () => {
    setSelectedBooking(null);
    setUserProfile(null);
  };

  const getUserInitials = (profile: UserProfile | null) => {
    if (!profile) return 'U';
    if (profile.displayName) {
      return profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (profile.email) {
      return profile.email[0].toUpperCase();
    }
    return 'U';
  };

  const canDeleteBooking = (status: string) => {
    return status === 'pending' || status === 'canceled' || status === 'failed';
  };

  const handleExportCSV = () => {
    toast({
      title: 'Exporting...',
      description: `Preparing to export records for ${filteredBookings.length} bookings.`,
    });

    const headers = ['Order ID', 'Event', 'User ID', 'Attendee Name', 'Attendee Email', 'Attendee Phone', 'Tickets in Order', 'Order Amount', 'Order Status', 'Booking Date', 'Booking Time'];

    const rows = filteredBookings.reduce((acc, booking) => {
      const ticketsInOrder = booking.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const orderAmount = booking.subtotal || 0;

      const commonData = [
        booking.orderId,
        booking.eventTitle || 'Unknown Event',
        booking.userId,
      ];
      
      const orderData = [
        ticketsInOrder,
        orderAmount,
        booking.status,
        formatDate(booking.createdAt),
        formatTime(booking.createdAt),
      ]

      if (booking.attendees && booking.attendees.length > 0) {
        booking.attendees.forEach(attendee => {
          const attendeeData = [
            attendee.name || 'N/A',
            attendee.email || 'N/A',
            attendee.phone ? `="${attendee.phone}"` : 'N/A',
          ];
          acc.push([...commonData, ...attendeeData, ...orderData]);
        });
      } else if (booking.tableContactDetails) {
        const attendeeData = [
          booking.tableContactDetails.fullName || 'N/A',
          booking.tableContactDetails.email || 'N/A',
          booking.tableContactDetails.phone ? `="${booking.tableContactDetails.phone}"` : 'N/A',
        ];
        acc.push([...commonData, ...attendeeData, ...orderData]);
      } else {
        // If no attendees, push a single row with N/A for attendee details
        const attendeeData = ['N/A', 'N/A', 'N/A'];
        acc.push([...commonData, ...attendeeData, ...orderData]);
      }
      
      return acc;
    }, [] as (string | number)[][]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_with_attendees-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export complete',
      description: `Exported ${rows.length} attendee records to CSV.`,
    });
  };

  const handleDeleteBooking = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    setDeletingOrderId(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
      
      // Invalidate cache to refetch orders
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      
      toast({
        title: 'Booking deleted',
        description: 'The booking has been successfully deleted.',
      });
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingOrderId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Bookings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">View and manage all event bookings.</p>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-foreground">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-foreground">
              {bookings.filter(b => b.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-border"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-muted border-border [&>span]:truncate">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-60">
            <SelectItem value="all">All Events</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                <span className="flex items-center gap-2">
                  {event.title}
                  {event.status !== 'published' && (
                    <Badge variant="outline" className="text-xs py-0 px-1">
                      {event.status}
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-muted border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results info */}
      {filteredBookings.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading bookings..." />
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Bookings will appear here as users purchase tickets.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {paginatedBookings.map((booking) => (
              <Card key={booking.orderId} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {booking.eventTitle || 'Unknown Event'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {booking.orderId.slice(0, 12)}...
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto capitalize">
                          <Badge variant="outline" className={getStatusBadge(booking.status)}>
                            {booking.status}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {booking.status === 'pending' && (
                          <DropdownMenuItem onSelect={() => handleUpdateStatus(booking.orderId, 'paid')}>
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        {booking.status === 'paid' && (
                          <DropdownMenuItem onSelect={() => handleUpdateStatus(booking.orderId, 'pending')}>
                            Mark as Pending
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      {booking.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} tickets
                    </div>
                    <div className="font-semibold text-foreground">
                      {formatPrice(booking.subtotal || 0, booking.currency)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      {formatDate(booking.createdAt)} • {formatTime(booking.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => handleViewProfile(booking)}
                      >
                        <User className="h-3.5 w-3.5" />
                        View Buyer
                      </Button>
                      {canDeleteBooking(booking.status) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteBooking(booking.orderId)}
                          disabled={deletingOrderId === booking.orderId}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingOrderId === booking.orderId ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden lg:block bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Order ID</TableHead>
                  <TableHead className="text-muted-foreground">Event</TableHead>
                  <TableHead className="text-muted-foreground">Items</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.map((booking) => (
                  <TableRow key={booking.orderId} className="border-border">
                    <TableCell className="font-mono text-sm text-foreground">
                      {booking.orderId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-foreground">
                      {booking.eventTitle || 'Unknown Event'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} tickets
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatPrice(booking.subtotal || 0, booking.currency)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="p-0 h-auto capitalize">
                            <Badge variant="outline" className={getStatusBadge(booking.status)}>
                              {booking.status}
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {booking.status === 'pending' && (
                            <DropdownMenuItem onSelect={() => handleUpdateStatus(booking.orderId, 'paid')}>
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {booking.status === 'paid' && (
                            <DropdownMenuItem onSelect={() => handleUpdateStatus(booking.orderId, 'pending')}>
                              Mark as Pending
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(booking.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-1.5"
                          onClick={() => handleViewProfile(booking)}
                        >
                          <User className="h-4 w-4" />
                          View Buyer
                        </Button>
                        {canDeleteBooking(booking.status) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteBooking(booking.orderId)}
                            disabled={deletingOrderId === booking.orderId}
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingOrderId === booking.orderId ? 'Deleting...' : 'Delete'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && closeProfileDialog()}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] flex flex-col bg-card border-border">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-foreground">Booking Details</DialogTitle>
          </DialogHeader>
          
          {profileLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading details..." />
            </div>
          ) : selectedBooking ? (
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Buyer Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Buyer Information</h4>
                <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                  <Avatar className="h-12 w-12 border-2 border-border shrink-0">
                    {userProfile?.photoUrl && (
                      <AvatarImage src={userProfile.photoUrl} alt={userProfile.displayName || 'User'} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {getUserInitials(userProfile)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {userProfile?.displayName || 'Unknown User'}
                    </p>
                    {userProfile?.email && (
                      <p className="text-sm text-muted-foreground truncate">{userProfile.email}</p>
                    )}
                    {userProfile?.phoneNumber && (
                      <p className="text-sm text-muted-foreground">{userProfile.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Order Summary</h4>
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="text-foreground font-mono text-xs">{selectedBooking.orderId.slice(-12).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Event</span>
                    <span className="text-foreground text-right max-w-[60%] truncate">{selectedBooking.eventTitle || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground">{formatDate(selectedBooking.createdAt)}, {formatTime(selectedBooking.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className={getStatusBadge(selectedBooking.status)}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Items</h4>
                <div className="space-y-2">
                  {selectedBooking.items?.map((item: any, index) => {
                    const price = item.price ?? item.unitPrice ?? item.chargeAmount ?? 0;
                    const name = item.tierName ?? item.name ?? 'Unknown Item';
                    return (
                      <div key={index} className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(price, selectedBooking.currency)} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-medium text-foreground ml-2">
                          {formatPrice(price * item.quantity, selectedBooking.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Totals */}
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(selectedBooking.subtotal || 0, selectedBooking.currency)}</span>
                  </div>
                  {selectedBooking.processingFee !== undefined && selectedBooking.processingFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span className="text-foreground">{formatPrice(selectedBooking.processingFee, selectedBooking.currency)}</span>
                    </div>
                  )}
                  {selectedBooking.discount !== undefined && selectedBooking.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount {selectedBooking.promoCode && `(${selectedBooking.promoCode})`}</span>
                      <span className="text-green-500">-{formatPrice(selectedBooking.discount, selectedBooking.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                    <span className="text-foreground">Total Paid</span>
                    <span className="text-foreground">{formatPrice(selectedBooking.total || selectedBooking.subtotal || 0, selectedBooking.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Donation Details */}
              {selectedBooking.donor && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Donation</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground text-sm">{selectedBooking.donor.name}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground ml-6">
                      {selectedBooking.donor.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{selectedBooking.donor.email}</span>
                        </div>
                      )}
                      {selectedBooking.donor.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{selectedBooking.donor.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Attendees */}
              {selectedBooking.attendees && selectedBooking.attendees.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Attendees ({selectedBooking.attendees.length})</h4>
                  <div className="space-y-2">
                    {selectedBooking.attendees.map((attendee, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground text-sm">{attendee.name || `Attendee ${index + 1}`}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground ml-6">
                          {attendee.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{attendee.email}</span>
                            </div>
                          )}
                          {attendee.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{attendee.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table Contact Details */}
              {selectedBooking.tableContactDetails && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Table Booking Contact</h4>
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{selectedBooking.tableContactDetails.fullName}</span>
                    </div>
                    {selectedBooking.tableContactDetails.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{selectedBooking.tableContactDetails.email}</span>
                      </div>
                    )}
                    {selectedBooking.tableContactDetails.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{selectedBooking.tableContactDetails.phone}</span>
                      </div>
                    )}
                    {selectedBooking.tableContactDetails.notes && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm text-foreground">{selectedBooking.tableContactDetails.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No booking information available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;
