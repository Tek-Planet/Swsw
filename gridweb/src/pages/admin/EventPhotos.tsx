import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Camera, Cpu, Image, Users, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from '@/components/LoadingSpinner';
import PhotoUploader from '@/components/admin/PhotoUploader';
import PhotoGrid from '@/components/admin/PhotoGrid';
import { useEventAlbums, useEventPhotos, usePhotoStats, ensureDefaultAlbum } from '@/hooks/useEventPhotos';
import { usePhotoUpload, useFaceRecognition } from '@/hooks/usePhotoUpload';
import { Event } from '@/types';

const EventPhotos = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [recognitionLimit, setRecognitionLimit] = useState(20);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
          setError('Event not found');
          setLoading(false);
          return;
        }

        const eventData = eventSnap.data();
        setEvent({
          id: eventSnap.id,
          ...eventData,
          startTime: eventData.startTime?.toDate?.() || new Date(eventData.startTime),
        } as Event);

        // Ensure default album and set it
        const albumId = await ensureDefaultAlbum(eventId);
        setSelectedAlbumId(albumId);

      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  // Hooks for data fetching
  const { data: albums = [] } = useEventAlbums(eventId || '');
  const { 
    data: photosData, 
    isLoading: photosLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchPhotos
  } = useEventPhotos(eventId || '', selectedAlbumId);
  
  const { data: photoStats, refetch: refetchStats } = usePhotoStats(eventId || '', selectedAlbumId);

  // Upload and recognition hooks
  const { uploadPhotos, uploadFiles, isUploading, clearUploadFiles } = usePhotoUpload(eventId || '');
  const { triggerRecognition, isProcessing } = useFaceRecognition(eventId || '');

  // Flatten photos from infinite query
  const photos = useMemo(() => {
    if (!photosData?.pages) return [];
    return photosData.pages.flatMap(page => page.photos);
  }, [photosData]);

  const handleRefresh = () => {
    refetchPhotos();
    refetchStats();
  };

  const handleTriggerRecognition = async () => {
    if (!selectedAlbumId) return;
    await triggerRecognition(selectedAlbumId, recognitionLimit);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading event..." />
      </div>
    );
  }

  if (error || !event || !eventId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/events')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Error</h1>
            <p className="text-muted-foreground">{error || 'Event not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/events/${eventId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Event Photos
            </h1>
            <p className="text-sm text-muted-foreground">{event.title}</p>
          </div>
        </div>
        
        <Button variant="outline" onClick={handleRefresh} disabled={photosLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${photosLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Image className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {photoStats?.totalPhotos || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Photos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Cpu className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {photoStats?.processedPhotos || 0}
                </p>
                <p className="text-xs text-muted-foreground">Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Camera className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {photoStats?.unprocessedPhotos || 0}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {albums.length}
                </p>
                <p className="text-xs text-muted-foreground">Albums</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="gallery" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="recognition">Face Recognition</TabsTrigger>
        </TabsList>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          {/* Album Selector */}
          {albums.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Album:</span>
              <Select 
                value={selectedAlbumId || ''} 
                onValueChange={setSelectedAlbumId}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select album" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map(album => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <PhotoGrid
            photos={photos}
            isLoading={photosLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={!!hasNextPage}
            onLoadMore={() => fetchNextPage()}
          />
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <PhotoUploader
            onUpload={uploadPhotos}
            uploadFiles={uploadFiles}
            isUploading={isUploading}
            onClear={clearUploadFiles}
          />
        </TabsContent>

        {/* Face Recognition Tab */}
        <TabsContent value="recognition">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Face Recognition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manually trigger face recognition on unprocessed photos. This will identify 
                registered users in photos and tag them automatically.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Process up to:</span>
                  <Select 
                    value={String(recognitionLimit)} 
                    onValueChange={(v) => setRecognitionLimit(Number(v))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">photos</span>
                </div>

                <Button 
                  onClick={handleTriggerRecognition}
                  disabled={isProcessing || !selectedAlbumId || (photoStats?.unprocessedPhotos || 0) === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Cpu className="h-4 w-4 mr-2" />
                      Run Face Recognition
                    </>
                  )}
                </Button>
              </div>

              {(photoStats?.unprocessedPhotos || 0) === 0 && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  All photos have been processed
                </Badge>
              )}

              {(photoStats?.unprocessedPhotos || 0) > 0 && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                  {photoStats?.unprocessedPhotos} photos awaiting recognition
                </Badge>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventPhotos;
