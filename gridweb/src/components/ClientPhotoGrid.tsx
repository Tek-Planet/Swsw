import { useEffect, useRef, useState } from 'react';
import { Loader2, ImageOff, X } from 'lucide-react';
import { Photo } from '@/hooks/useEventPhotos';

interface ClientPhotoGridProps {
  photos: Photo[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
}

const ClientPhotoGrid = ({
  photos,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: ClientPhotoGridProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (lightboxIndex !== null) {
        if (e.key === 'ArrowRight' && lightboxIndex < photos.length - 1) setLightboxIndex(lightboxIndex + 1);
        if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, photos.length]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ImageOff className="h-10 w-10 mb-3" />
        <p className="text-base font-medium">No photos yet</p>
        <p className="text-sm">Photos will appear here once uploaded.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setLightboxIndex(index)}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={photo.thumbUrl || photo.url}
              alt="Event photo"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <div ref={loadMoreRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!hasNextPage && photos.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          All {photos.length} photos loaded
        </p>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-8 w-8" />
          </button>

          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white text-4xl z-10 p-2"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              ‹
            </button>
          )}

          {lightboxIndex < photos.length - 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white text-4xl z-10 p-2"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            >
              ›
            </button>
          )}

          <img
            src={photos[lightboxIndex].url || photos[lightboxIndex].thumbUrl}
            alt="Event photo"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ClientPhotoGrid;
