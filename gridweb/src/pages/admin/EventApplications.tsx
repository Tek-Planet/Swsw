import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEventApplications } from '@/hooks/useEventApplications';
import { useEvent } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { ApplicationStatus, GenderCategory } from '@/types';

const EventApplications = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { event } = useEvent(eventId || '');
  const { applications, loading, updateApplicationStatus, refetch } = useEventApplications(eventId || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  const filtered = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (genderFilter !== 'all' && app.gender !== genderFilter) return false;
    return true;
  });

  const genderCounts = applications.reduce(
    (acc, app) => {
      acc[app.gender] = (acc[app.gender] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleApprove = async (appId: string) => {
    if (!user) return;
    await updateApplicationStatus(appId, 'approved', user.uid);
  };

  const handleReject = async (appId: string) => {
    if (!user) return;
    await updateApplicationStatus(appId, 'rejected', user.uid);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading applications..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/admin/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground">{event?.title}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-foreground">{applications.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{statusCounts['pending'] || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-500">{statusCounts['approved'] || 0}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{genderCounts['male'] || 0}M / {genderCounts['female'] || 0}F</p>
            <p className="text-xs text-muted-foreground">Gender Split</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{genderCounts['other'] || 0}</p>
            <p className="text-xs text-muted-foreground">Other</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No applications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(app => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {app.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.age}</TableCell>
                      <TableCell className="text-sm">{app.tierName}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <p>{app.email}</p>
                          <p className="text-muted-foreground">{app.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate">{app.reason}</p>
                        {app.customAnswers && Object.entries(app.customAnswers).length > 0 && (
                          <details className="mt-1">
                            <summary className="text-xs text-primary cursor-pointer">Custom answers</summary>
                            <div className="text-xs mt-1 space-y-0.5">
                              {Object.entries(app.customAnswers).map(([key, val]) => (
                                <p key={key}><span className="text-muted-foreground">{key}:</span> {val}</p>
                              ))}
                            </div>
                          </details>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.status === 'pending' && (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </Badge>
                        )}
                        {app.status === 'approved' && (
                          <Badge variant="outline" className="text-green-500 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                          </Badge>
                        )}
                        {app.status === 'rejected' && (
                          <Badge variant="outline" className="text-destructive border-destructive/30">
                            <XCircle className="w-3 h-3 mr-1" /> Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-green-500 hover:text-green-400" onClick={() => handleApprove(app.id)}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleReject(app.id)}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                        {app.status !== 'pending' && (
                          <span className="text-xs text-muted-foreground">Reviewed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventApplications;
