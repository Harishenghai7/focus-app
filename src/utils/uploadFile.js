// src/utils/uploadFile.js
import { supabase } from '../supabaseClient';

export const uploadFile = async (file, bucket, userId, fileId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${fileId}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { url: publicUrl, path: data.path };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Example usage:
// import { uploadFile } from './utils/uploadFile';
// const { url } = await uploadFile(file, 'avatars', user.id, 'profile');
