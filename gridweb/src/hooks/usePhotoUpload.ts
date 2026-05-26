import { useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { useQueryClient } from "@tanstack/react-query";
import { functions } from "@/lib/firebase";
import { createPhotoDoc, ensureDefaultAlbum } from "./useEventPhotos";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UploadFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface BatchUploadUrlResult {
  urls: Array<{ uploadUrl: string; s3Key: string, viewUrl:string }>;
}

export const usePhotoUpload = (eventId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadPhotos = useCallback(
    async (files: File[]) => {
      if (!user) {
        toast.error("You must be logged in to upload photos");
        return;
      }

      if (files.length === 0) return;
      if (files.length > 20) {
        toast.error("Maximum 20 files per batch");
        return;
      }

      // Validate file types
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
      const invalidFiles = files.filter((f) => !validTypes.includes(f.type));
      if (invalidFiles.length > 0) {
        toast.error(`Invalid file types: ${invalidFiles.map((f) => f.name).join(", ")}`);
        return;
      }

      // Validate file sizes (max 10MB each)
      const maxSize = 10 * 1024 * 1024;
      const oversizedFiles = files.filter((f) => f.size > maxSize);
      if (oversizedFiles.length > 0) {
        toast.error(`Files too large (max 10MB): ${oversizedFiles.map((f) => f.name).join(", ")}`);
        return;
      }

      setIsUploading(true);
      setUploadFiles(
        files.map((file) => ({
          file,
          progress: 0,
          status: "pending",
        })),
      );

      try {
        // Step 1: Get pre-signed URLs from Firebase function
        const generateBatchUrls = httpsCallable<
          { files: { fileName: string; fileType: string }[]; eventId: string },
          BatchUploadUrlResult
        >(functions, "adminGenerateBatchS3UploadUrls");

        const filesPayload = files.map((f) => ({
          fileName: f.name,
          fileType: f.type,
        }));

        console.log("[usePhotoUpload] Requesting batch upload URLs...");
        const result = await generateBatchUrls({ files: filesPayload, eventId });

        if (!result.data?.urls || result.data.urls.length !== files.length) {
          throw new Error("Failed to get upload URLs from server");
        }

        const uploadUrls = result.data.urls;
        console.log(`[usePhotoUpload] Received ${uploadUrls.length} upload URLs`, uploadUrls[0]);

        // Step 2: Ensure default album exists
        const albumId = await ensureDefaultAlbum(eventId);

        // Step 3: Upload each file to S3 and create Firestore docs
        const uploadPromises = files.map(async (file, index) => {
          const { uploadUrl, s3Key, viewUrl } = uploadUrls[index];

          try {
            // Update status to uploading
            setUploadFiles((prev) =>
              prev.map((f, i) => (i === index ? { ...f, status: "uploading", progress: 10 } : f)),
            );

            // Upload to S3
            const response = await fetch(uploadUrl, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type,
              },
            });

            if (!response.ok) {
              throw new Error(`S3 upload failed: ${response.statusText}`);
            }

            setUploadFiles((prev) => prev.map((f, i) => (i === index ? { ...f, progress: 70 } : f)));

            // Create Firestore document
            await createPhotoDoc(eventId, albumId, {
              s3Key,
              url: viewUrl,
              thumbUrl: viewUrl,
              uploadedBy: "admin",
              uploaderId: user.uid,
              recognizedUserIds: [],
              recognitionProcessedAt: null,
            });

            setUploadFiles((prev) =>
              prev.map((f, i) => (i === index ? { ...f, status: "success", progress: 100 } : f)),
            );

            console.log(`[usePhotoUpload] Successfully uploaded: ${file.name}`);
            return { success: true, fileName: file.name };
          } catch (error) {
            console.error(`[usePhotoUpload] Failed to upload ${file.name}:`, error);
            setUploadFiles((prev) =>
              prev.map((f, i) => (i === index ? { ...f, status: "error", error: String(error) } : f)),
            );
            return { success: false, fileName: file.name, error };
          }
        });

        const results = await Promise.all(uploadPromises);
        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success).length;

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["event-photos", eventId] });
        queryClient.invalidateQueries({ queryKey: ["photo-stats", eventId] });

        if (successCount > 0) {
          toast.success(`Successfully uploaded ${successCount} photo${successCount > 1 ? "s" : ""}`);
        }
        if (failCount > 0) {
          toast.error(`Failed to upload ${failCount} photo${failCount > 1 ? "s" : ""}`);
        }
      } catch (error) {
        console.error("[usePhotoUpload] Batch upload failed:", error);
        toast.error("Failed to upload photos. Please try again.");
        setUploadFiles((prev) => prev.map((f) => ({ ...f, status: "error", error: String(error) })));
      } finally {
        setIsUploading(false);
      }
    },
    [eventId, user, queryClient],
  );

  const clearUploadFiles = useCallback(() => {
    setUploadFiles([]);
  }, []);

  return {
    uploadPhotos,
    uploadFiles,
    isUploading,
    clearUploadFiles,
  };
};

// Hook for triggering face recognition
export const useFaceRecognition = (eventId: string) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ processed: number; message: string } | null>(null);
  const queryClient = useQueryClient();

  const triggerRecognition = useCallback(
    async (albumId?: string, photoLimit: number = 20) => {
      setIsProcessing(true);
      setResult(null);

      try {
        const runRecognition = httpsCallable<
          { eventId: string; albumId?: string; limit?: number },
          { processed: number; message: string }
        >(functions, "adminRunEventFaceRecognition");

        console.log("[useFaceRecognition] Triggering recognition for event:", eventId);
        const response = await runRecognition({
          eventId,
          albumId,
          limit: photoLimit,
        });

        setResult(response.data);
        toast.success(response.data.message);

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["event-photos", eventId] });
        queryClient.invalidateQueries({ queryKey: ["photo-stats", eventId] });

        return response.data;
      } catch (error: any) {
        console.error("[useFaceRecognition] Recognition failed:", error);
        const message = error?.message || "Face recognition failed";
        toast.error(message);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [eventId, queryClient],
  );

  return {
    triggerRecognition,
    isProcessing,
    result,
  };
};
