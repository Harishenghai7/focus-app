import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { compressImage, createVideoThumbnail } from '../utils/mediaUtils';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const uploadFile = useCallback(async (file, userId, options = {}) => {
    try {
      const isVideo = file.type.startsWith('video');
      let processedFile = file;
      let thumbnailUrl = null;

      // Compress images
      if (!isVideo && file.size > 1024 * 1024) {
        processedFile = await compressImage(file, 1920, 1920, 0.85);
      }

      // Generate video thumbnail
      if (isVideo) {
        const thumbBlob = await createVideoThumbnail(URL.createObjectURL(file), 0);
        if (thumbBlob) {
          const thumbFile = new File([thumbBlob], 'thumb.jpg', { type: 'image/jpeg' });
          const fileName = `${userId}/${Date.now()}-thumb.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, thumbFile);

          if (!uploadError) {
            const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
            thumbnailUrl = data.publicUrl;
          }
        }
      }

      // Upload main file
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const bucket = isVideo ? 'videos' : 'posts';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

      return {
        url: data.publicUrl,
        thumbnailUrl,
        type: isVideo ? 'video' : 'image',
        fileName
      };
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  }, []);

  const uploadMultiple = useCallback(async (files, userId, onProgressUpdate) => {
    setUploading(true);
    setError(null);
    setProgress(0);
    const urls = [];

    try {
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const result = await uploadFile(files[i], userId);
        urls.push(result);
        
        const currentProgress = ((i + 1) / totalFiles) * 100;
        setProgress(currentProgress);
        
        if (onProgressUpdate) {
          onProgressUpdate(currentProgress, i + 1, totalFiles);
        }
      }

      setUploadedUrls(urls);
      setUploading(false);
      return urls;
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      throw err;
    }
  }, [uploadFile]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedUrls([]);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadedUrls,
    uploadFile,
    uploadMultiple,
    reset
  };
};
