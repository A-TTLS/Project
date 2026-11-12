/**
 * mealImageUpload.ts
 * ------------------
 * Reusable hook + helper for uploading meal photos to Supabase Storage
 * bucket: "meal-snaps"  (create this bucket in Supabase Dashboard → Storage)
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

export async function uploadMealImage(file: File): Promise<UploadResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Check your .env file.');
  }

  // Unique filename: userId-timestamp.ext  (prevents overwrites)
  const ext = file.name.split('.').pop() ?? 'jpg';
  const timestamp = Date.now();
  const filename = `meal_${timestamp}_${Math.random().toString(36).slice(2)}.${ext}`;

  // 1. Upload to Supabase Storage bucket "meal-snaps"
  const { data, error } = await supabase.storage
    .from('meal-snaps')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,          // never silently overwrite
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // 2. Get the permanent public URL
  const { data: urlData } = supabase.storage
    .from('meal-snaps')
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error('Could not retrieve public URL after upload.');
  }

  return { publicUrl: urlData.publicUrl, path: data.path };
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
  const pickAndUpload = (onUploaded?: (url: string) => void) => {
    // Create a hidden input if it doesn't exist yet
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';

      // Mobile: show camera AND gallery option
      input.accept = 'image/*';
      // 'capture' hints mobile browsers to open camera by default.
      // Remove this attribute if you want gallery-only.
      input.capture = 'environment'; // 'environment' = rear camera, 'user' = front

      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    const input = fileInputRef.current;

    // Reset so re-selecting the same file still fires onChange
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
        onUploaded?.(publicUrl);
      } catch (err: any) {
        setUploadError(err.message ?? 'Upload failed.');
      } finally {
        setIsUploading(false);
      }
    };

    input.click(); // programmatically open the file picker
  };

  const reset = () => {
    setImageUrl(null);
    setUploadError(null);
    setIsUploading(false);
  };

  return { pickAndUpload, imageUrl, isUploading, uploadError, reset };
}

