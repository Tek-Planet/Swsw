import { useEffect, useRef, useCallback } from 'react';
import { Loader2, User, CheckCircle, Clock, ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Photo } from '@/hooks/useEventPhotos';

interface PhotoGridProps {
  photos: Photo[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
}

const PhotoGrid = ({ 
  photos, 
  isLoading, 
  isFetchingNextPage, 
  hasNextPage, 
  onLoadMore 
}: PhotoGridProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ImageOff className="h-12 w-12 mb-3" />
        <p className="text-lg font-medium">No photos yet</p>
        <p className="text-sm">Upload photos using the uploader above</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-4" />
      
      {/* Loading indicator for next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
      {/* End of list indicator */}
      {!hasNextPage && photos.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          All {photos.length} photos loaded
        </p>
      )}
    </div>
  );
};

interface PhotoCardProps {
  photo: Photo;
}

const PhotoCard = ({ photo }: PhotoCardProps) => {
  const isProcessed = !!photo.recognitionProcessedAt;
  const hasRecognizedUsers = photo.recognizedUserIds && photo.recognizedUserIds.length > 0;

  return (
    <div className="relative group rounded-lg overflow-hidden bg-muted aspect-square">
      {/* Image */}
      <img
        src={photo.thumbUrl || photo.url}
        alt="Event photo"
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        {/* Top badges */}
        <div className="flex gap-1 flex-wrap">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs bg-background/80",
              photo.uploadedBy === 'admin' 
                ? "border-purple-500/50 text-purple-400" 
                : "border-blue-500/50 text-blue-400"
            )}
          >
            {photo.uploadedBy === 'admin' ? 'Admin' : 'User'}
          </Badge>
        </div>
        
        {/* Bottom info */}
        <div className="flex items-center justify-between">
          {/* Recognition status */}
          <div className="flex items-center gap-1">
            {isProcessed ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-yellow-400" />
            )}
            <span className="text-xs text-white">
              {isProcessed ? 'Processed' : 'Pending'}
            </span>
          </div>
          
          {/* Recognized users count */}
          {hasRecognizedUsers && (
            <div className="flex items-center gap-1 text-white">
              <User className="h-3.5 w-3.5" />
              <span className="text-xs">{photo.recognizedUserIds!.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Always visible status indicator */}
      <div className="absolute top-1.5 right-1.5">
        {isProcessed ? (
          <div className="bg-green-500 rounded-full p-0.5">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        ) : (
          <div className="bg-yellow-500 rounded-full p-0.5">
            <Clock className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoGrid;
