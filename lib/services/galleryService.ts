import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
  doc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { AccessibleEvent, Album, Photo } from "@/types/gallery";

const S3_BUCKET_NAME = "photobooth-23f98.appspot.com";
const S3_REGION = "us-east-1";

const getPublicUrlFromS3Key = (s3Key: string) => {
  if (!s3Key) return undefined;
  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
};

const mapDocToPhoto = (doc: any): Photo => {
  const data = doc.data();
  const photo: Photo = {
    id: doc.id,
    s3Key: data.s3Key,
    url: getPublicUrlFromS3Key(data.s3Key),
    thumbUrl: getPublicUrlFromS3Key(data.s3Key),
    ...data,
  };
  return photo;
};

export function listenAlbumPhotos(
  eventId: string,
  albumId: string,
  callback: (photos: Photo[]) => void
): Unsubscribe {
  const photosQuery = query(
    collection(db, "events", eventId, "albums", albumId, "photos"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(photosQuery, (snapshot) => {
    const photos = snapshot.docs.map(mapDocToPhoto);
    callback(photos);
  });
}

export async function getEventPhotoPreview(
  eventId: string,
  limitPhotos: number = 6
): Promise<{
  albums: Album[];
  previewPhotos: Photo[];
  initialAlbumId?: string;
}> {
  const albumsQuery = query(
    collection(db, "events", eventId, "albums"),
    where("isActive", "==", true),
    orderBy("sortOrder", "asc"),
    limit(3)
  );

  const albumSnapshot = await getDocs(albumsQuery);
  if (albumSnapshot.empty) {
    return { albums: [], previewPhotos: [], initialAlbumId: undefined };
  }

  const albums = albumSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Album)
  );
  const initialAlbumId = albums[0].id;

  const photosQuery = query(
    collection(db, "events", eventId, "albums", initialAlbumId, "photos"),
    orderBy("createdAt", "desc"),
    limit(limitPhotos)
  );

  const photoSnapshot = await getDocs(photosQuery);
  const previewPhotos = photoSnapshot.docs.map(mapDocToPhoto);

  return { albums, previewPhotos, initialAlbumId };
}

export async function ensureDefaultAlbum(eventId: string): Promise<string> {
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
}

export async function createPhotoDoc(
  eventId: string,
  albumId: string,
  photoData: Partial<Photo>
): Promise<void> {
  const photosRef = collection(
    db,
    "events",
    eventId,
    "albums",
    albumId,
    "photos"
  );
  await addDoc(photosRef, photoData);
}

export async function getEventCoverPhotoUrl(
  eventId: string
): Promise<string | null> {
  try {
    const albumId = await ensureDefaultAlbum(eventId);
    const photosQuery = query(
      collection(db, "events", eventId, "albums", albumId, "photos"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const photoSnapshot = await getDocs(photosQuery);

    if (photoSnapshot.empty) return null;

    const photo = photoSnapshot.docs[0].data();
    return getPublicUrlFromS3Key(photo.s3Key) ?? null;
  } catch (error) {
    console.error(`Failed to get cover photo for event ${eventId}:`, error);
    return null;
  }
}

export async function getEventAlbumPreview(
  eventId: string
): Promise<{ coverPhotoUrl: string | null; photoCount: number }> {
  try {
    const albumId = await ensureDefaultAlbum(eventId);
    const albumRef = doc(db, "events", eventId, "albums", albumId);
    const photosQuery = query(
      collection(db, "events", eventId, "albums", albumId, "photos"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const [albumSnapshot, photoSnapshot] = await Promise.all([
      getDoc(albumRef),
      getDocs(photosQuery),
    ]);

    let coverPhotoUrl: string | null = null;
    if (!photoSnapshot.empty) {
      const latestPhoto = photoSnapshot.docs[0].data();
      coverPhotoUrl = getPublicUrlFromS3Key(latestPhoto.s3Key) ?? null;
    }

    const photoCount = albumSnapshot.exists()
      ? albumSnapshot.data().photoCount || 0
      : 0;

    return { coverPhotoUrl, photoCount };
  } catch (error) {
    console.error(
      `Failed to get event album preview for event ${eventId}:`,
      error
    );
    return { coverPhotoUrl: null, photoCount: 0 };
  }
}

export async function getUserAccessibleEventIds(
  uid: string
): Promise<string[]> {
  const eventsQuery = query(
    collection(db, "events"),
    where("attendeeIds", "array-contains", uid)
  );
  const snapshot = await getDocs(eventsQuery);

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => doc.id as string);
}

export async function getUserAccessibleEvents(
  uid: string
): Promise<AccessibleEvent[]> {
  const eventsQuery = query(
    collection(db, "events"),
    where("attendeeIds", "array-contains", uid),
    orderBy("startTime", "desc")
  );
  const snapshot = await getDocs(eventsQuery);

  if (snapshot.empty) return [];

  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        title: doc.data().title || "Untitled Event",
      } as AccessibleEvent)
  );
}
