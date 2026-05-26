import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const S3_BUCKET_NAME = import.meta.env.VITE_S3_BUCKET_NAME || "photobooth-23f98.appspot.com";
const S3_REGION = import.meta.env.VITE_S3_REGION || "us-east-1";

export const getPublicUrlFromS3Key = (s3Key: string): string => {
  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
};

export interface Photo {
  id: string;
  s3Key: string;
  url?: string;
  thumbUrl?: string;
  uploadedBy: 'user' | 'admin';
  uploaderId: string;
  createdAt: any;
  recognizedUserIds?: string[];
  recognitionProcessedAt?: any;
  eventId?: string;
}

export interface Album {
  id: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
  photoCount?: number;
  createdAt?: any;
}

const mapDocToPhoto = (doc: QueryDocumentSnapshot<DocumentData>): Photo => {
  const data = doc.data();
  return {
    id: doc.id,
    s3Key: data.s3Key,
    url: data.url,
    thumbUrl: data.thumbUrl || data.url,
    uploadedBy: data.uploadedBy || 'user',
    uploaderId: data.uploaderId,
    createdAt: data.createdAt,
    recognizedUserIds: data.recognizedUserIds || [],
    recognitionProcessedAt: data.recognitionProcessedAt,
    eventId: data.eventId,
  };
};

// Ensure default album exists
export const ensureDefaultAlbum = async (eventId: string): Promise<string> => {
  const albumsRef = collection(db, "events", eventId, "albums");
  const q = query(albumsRef, where("title", "==", "Event Photos"), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  } else {
    const albumData = {
      title: "Event Photos",
      isActive: true,
      sortOrder: 0,
      createdAt: serverTimestamp(),
      photoCount: 0,
    };
    const docRef = await addDoc(albumsRef, albumData);
    return docRef.id;
  }
};

// Fetch albums for an event
const fetchEventAlbums = async (eventId: string): Promise<Album[]> => {
  const albumsQuery = query(
    collection(db, "events", eventId, "albums"),
    where("isActive", "==", true),
    orderBy("sortOrder", "asc")
  );
  
  const snapshot = await getDocs(albumsQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Album[];
};

// Hook to get event albums
export const useEventAlbums = (eventId: string) => {
  return useQuery({
    queryKey: ["event-albums", eventId],
    queryFn: () => fetchEventAlbums(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch photos with pagination
const PHOTOS_PER_PAGE = 20;

interface PhotoPage {
  photos: Photo[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

const fetchPhotosPage = async (
  eventId: string, 
  albumId: string, 
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<PhotoPage> => {
  const photosRef = collection(db, "events", eventId, "albums", albumId, "photos");
  
  let q = query(
    photosRef,
    orderBy("createdAt", "desc"),
    limit(PHOTOS_PER_PAGE + 1) // Fetch one extra to check if there's more
  );
  
  if (lastDoc) {
    q = query(
      photosRef,
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(PHOTOS_PER_PAGE + 1)
    );
  }
  
  const snapshot = await getDocs(q);
  const docs = snapshot.docs;
  const hasMore = docs.length > PHOTOS_PER_PAGE;
  
  // Remove the extra doc if it exists
  const photoDocs = hasMore ? docs.slice(0, -1) : docs;
  
  return {
    photos: photoDocs.map(mapDocToPhoto),
    lastDoc: photoDocs.length > 0 ? photoDocs[photoDocs.length - 1] : null,
    hasMore,
  };
};

// Infinite query hook for photos with lazy loading
export const useEventPhotos = (eventId: string, albumId: string | null) => {
  return useInfiniteQuery({
    queryKey: ["event-photos", eventId, albumId],
    queryFn: ({ pageParam }) => fetchPhotosPage(eventId, albumId!, pageParam),
    initialPageParam: undefined as QueryDocumentSnapshot<DocumentData> | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
    enabled: !!eventId && !!albumId,
    staleTime: 2 * 60 * 1000,
  });
};

// Get photo stats for an event
interface PhotoStats {
  totalPhotos: number;
  processedPhotos: number;
  unprocessedPhotos: number;
}

const fetchPhotoStats = async (eventId: string, albumId: string): Promise<PhotoStats> => {
  const photosRef = collection(db, "events", eventId, "albums", albumId, "photos");
  
  // Get all photos count
  const allPhotosSnap = await getDocs(photosRef);
  const totalPhotos = allPhotosSnap.size;
  
  // Get processed photos count
  const processedQuery = query(
    photosRef,
    where("recognitionProcessedAt", "!=", null)
  );
  const processedSnap = await getDocs(processedQuery);
  const processedPhotos = processedSnap.size;
  
  return {
    totalPhotos,
    processedPhotos,
    unprocessedPhotos: totalPhotos - processedPhotos,
  };
};

export const usePhotoStats = (eventId: string, albumId: string | null) => {
  return useQuery({
    queryKey: ["photo-stats", eventId, albumId],
    queryFn: () => fetchPhotoStats(eventId, albumId!),
    enabled: !!eventId && !!albumId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Create photo document in Firestore
export const createPhotoDoc = async (
  eventId: string,
  albumId: string,
  photoData: Partial<Photo>
): Promise<string> => {
  const photosRef = collection(db, "events", eventId, "albums", albumId, "photos");
  const docRef = await addDoc(photosRef, {
    ...photoData,
    eventId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};
