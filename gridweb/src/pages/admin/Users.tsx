import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
} from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShieldCheck, 
  Calendar, 
  Plus, 
  Trash2, 
  Search,
  UserPlus,
  Settings2
} from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAllEvents } from '@/hooks/useAllEvents';
import { UserRole, UserWithRole, UserRoleAssignment } from '@/types/roles';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

const Users = () => {
  const { users, roles, usersLoading, rolesLoading, addRole, removeRole, updateEvents, isAdding, isRemoving } = useUserRoles();
  const { events } = useAllEvents();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [manageEventsDialogOpen, setManageEventsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('event_admin');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<UserRoleAssignment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const usersWithRoles = useMemo(() => {
    if (!users) return [];
    return users.map(u => ({
      ...u,
      roles: roles.filter(r => r.userId === u.uid),
    }));
  }, [users, roles]);

  const filteredUsers = useMemo(() => {
    if (rolesLoading) {
      return usersWithRoles.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return usersWithRoles.filter(user => {
      const searchMatch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (roleFilter === 'all') {
        return searchMatch;
      }
      
      return searchMatch && user.roles.some(role => role.role === roleFilter);
    });
  }, [usersWithRoles, searchQuery, roleFilter, rolesLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  if (usersLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    );
  }

  const handleAddRole = () => {
    if (!selectedUser) return;
    addRole({ userId: selectedUser.uid, role: selectedRole, eventIds: selectedRole === 'event_admin' ? selectedEventIds : undefined });
    setAddRoleDialogOpen(false);
    setSelectedUser(null);
    setSelectedRole('event_admin');
    setSelectedEventIds([]);
  };

  const handleUpdateEvents = () => {
    if (!editingRole) return;
    updateEvents({ roleId: editingRole.id, eventIds: selectedEventIds, userId: editingRole.userId });
    setManageEventsDialogOpen(false);
    setEditingRole(null);
    setSelectedEventIds([]);
  };

  const openManageEventsDialog = (role: UserRoleAssignment) => {
    setEditingRole(role);
    setSelectedEventIds(role.eventIds || []);
    setManageEventsDialogOpen(true);
  };

  const getRoleBadge = (role: UserRole) => {
    return role === 'admin' ? (
      <Badge className="bg-primary/20 text-primary border-primary/30"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>
    ) : (
      <Badge variant="secondary" className="bg-accent/20 text-accent-foreground"><Calendar className="h-3 w-3 mr-1" />Event Admin</Badge>
    );
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev => prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage admin roles and event access</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-border"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter} disabled={rolesLoading}>
          <SelectTrigger className="w-full sm:w-48 bg-muted border-border">
            <SelectValue placeholder="Filter by role..." />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="event_admin">Event Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredUsers.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
        </div>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0">
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Roles</TableHead>
                  <TableHead className="text-muted-foreground">Assigned Events</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.uid} className="border-border">
                    <TableCell className="py-3">
                      <div>
                        <p className="font-medium text-foreground">{user.email}</p>
                        {user.displayName && <p className="text-sm text-muted-foreground">{user.displayName}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {rolesLoading ? <Skeleton className="h-5 w-20 rounded" /> : (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? <span className="text-sm text-muted-foreground">No roles</span> : (
                            user.roles.map((role) => (
                              <div key={role.id} className="flex items-center gap-1">
                                {getRoleBadge(role.role)}
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => removeRole({ roleId: role.id, userId: role.userId, role: role.role })} disabled={isRemoving}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {rolesLoading ? <Skeleton className="h-5 w-24 rounded" /> : (
                        user.roles.filter(r => r.role === 'event_admin').map(role => (
                          <div key={role.id} className="flex flex-col gap-1">
                            {role.eventIds && role.eventIds.length > 0 ? (
                              <div className="flex flex-wrap gap-1 items-center">
                                {role.eventIds.map(eventId => {
                                  const event = events.find(e => e.id === eventId);
                                  return <Badge key={eventId} variant="outline" className="text-xs font-normal">{event?.title || eventId.slice(0, 8)}</Badge>;
                                })}
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openManageEventsDialog(role)}><Settings2 className="h-3 w-3 mr-1" />Edit</Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={() => openManageEventsDialog(role)}><Plus className="h-3 w-3 mr-1" />Assign events</Button>
                            )}
                          </div>
                        ))
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Dialog open={addRoleDialogOpen && selectedUser?.uid === user.uid} onOpenChange={(open) => { setAddRoleDialogOpen(open); if (!open) setSelectedUser(null); }}>
                        <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}><UserPlus className="h-4 w-4 mr-1" />Add Role</Button></DialogTrigger>
                        <DialogContent className="bg-card border-border w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                          <DialogHeader className="flex-shrink-0">
                            <DialogTitle className="text-foreground">Add Role</DialogTitle>
                            <DialogDescription className="text-muted-foreground">Assign a role to {user.email}</DialogDescription>
                          </DialogHeader>
                          <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-foreground">Role Type</Label>
                              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                                <SelectTrigger className="w-full bg-muted border-border text-foreground"><SelectValue placeholder="Select a role" /></SelectTrigger>
                                <SelectContent className="bg-popover border-border z-50">
                                  <SelectItem value="admin"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Admin (Full Access)</span></SelectItem>
                                  <SelectItem value="event_admin"><span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Event Admin</span></SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {selectedRole === 'event_admin' && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">Assign Events</Label>
                                <ScrollArea className="h-48 border border-border rounded-md">
                                  <div className="p-2 space-y-1">
                                    {events.map((event) => (
                                      <div key={event.id} className={cn("flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer", selectedEventIds.includes(event.id) ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent")} onClick={() => toggleEventSelection(event.id)}>
                                        <Checkbox checked={selectedEventIds.includes(event.id)} onCheckedChange={() => toggleEventSelection(event.id)} className="pointer-events-none h-4 w-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0"><p className="font-medium text-sm text-foreground break-words leading-tight">{event.title}</p><p className="text-xs text-muted-foreground">{format(event.startTime, 'MMM d, yyyy')}</p></div>
                                      </div>
                                    ))}
                                    {events.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No events available</p>}
                                  </div>
                                </ScrollArea>
                              </div>
                            )}
                          </div>
                          <DialogFooter className="flex-shrink-0 gap-2 pt-2">
                            <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddRole} disabled={isAdding || (selectedRole === 'event_admin' && selectedEventIds.length === 0)}>{isAdding ? 'Adding...' : 'Add Role'}</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedUsers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">{searchQuery ? 'No users match your search' : 'No users found'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>
                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === 'ellipsis' ? <PaginationEllipsis /> : <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page as number); }} isActive={currentPage === page}>{page}</PaginationLink>}
                    </PaginationItem>
                  ))}
                  <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={manageEventsDialogOpen} onOpenChange={setManageEventsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Manage Event Access</DialogTitle>
            <DialogDescription>Select which events this admin can manage</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-64 border border-border rounded-md p-3">
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className={cn("flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer", selectedEventIds.includes(event.id) ? "bg-primary/10" : "hover:bg-muted")} onClick={() => toggleEventSelection(event.id)}>
                  <Checkbox checked={selectedEventIds.includes(event.id)} onCheckedChange={() => toggleEventSelection(event.id)} className="pointer-events-none" />
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm text-foreground truncate">{event.title}</p><p className="text-xs text-muted-foreground">{format(event.startTime, 'MMM d, yyyy')}</p></div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageEventsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateEvents}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
