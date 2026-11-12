/**
 * mealImageUpload.ts
 * ------------------
 * Reusable hook + helper for uploading meal photos to Supabase Storage
 * bucket: "meals-snap"  (or "meal-snaps" as fallback)
 *
 * Usage in any component:
 *   const { pickAndUpload, imageUrl, isUploading, uploadError, reset } = useMealImageUpload();
 */

import { useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadResult {
  publicUrl: string;
  path: string;
}

// ─── Core upload function (can be called standalone) ─────────────────────────

export async function uploadMealImage(file: File | Blob, userId?: string): Promise<UploadResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Check your .env file.');
  }

  // Determine user folder prefix & unique filename: ${userId}/${Date.now()}.jpg
  const userPrefix = userId || (await supabase.auth.getUser()).data.user?.id || 'guest';
  const timestamp = Date.now();
  const filePath = `${userPrefix}/${timestamp}.jpg`;

  // 1. Try uploading to "meals-snap" bucket
  let bucketName = 'meals-snap';
  let { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  // Fallback to "meal-snaps" if "meals-snap" doesn't exist
  if (error && (error.message.includes('not found') || (error as any).statusCode === 404)) {
    bucketName = 'meal-snaps';
    const retry = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // 2. Get the permanent public URL
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data!.path);

  if (!urlData?.publicUrl) {
    throw new Error('Could not retrieve public URL after upload.');
  }

  return { publicUrl: urlData.publicUrl, path: data!.path };
}

// ─── React hook ──────────────────────────────────────────────────────────────

export function useMealImageUpload() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hidden <input type="file"> reference — triggered programmatically
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Open the native file / camera picker, then upload on selection.
   * Pass onUploaded callback to receive the public URL immediately.
   */
  const pickAndUpload = (onUploaded?: (url: string, file?: File) => void) => {
    // Create a hidden input if it doesn't exist yet
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';

      // Mobile: show camera AND gallery option
      input.accept = 'image/*';
      input.capture = 'environment'; // 'environment' = rear camera

      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    const input = fileInputRef.current;
    input.value = '';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);
      setUploadError(null);
      setImageUrl(null);

      try {
        const { publicUrl } = await uploadMealImage(file);
        setImageUrl(publicUrl);
        onUploaded?.(publicUrl, file);
      } catch (err: any) {
        setUploadError(err.message ?? 'Upload failed.');
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  };

  const reset = () => {
    setImageUrl(null);
    setUploadError(null);
    setIsUploading(false);
  };

  return { pickAndUpload, imageUrl, isUploading, uploadError, reset, uploadImage: uploadMealImage };
}


