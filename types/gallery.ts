
export type Album = {
  id: string;
  title: string;
  coverPhotoUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  photoCount?: number;
};

export type Photo = {
  id: string;
  url: string;
  thumbUrl?: string;
  uploadedBy: "host" | "user";
  createdAt?: Date;
  taggedUserIds?: string[];
};
