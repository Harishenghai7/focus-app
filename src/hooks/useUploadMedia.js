import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const useUploadMedia = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const uploadFile = async (file, bucket = 'posts') => {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            setProgress(100);
            return publicUrl;

        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const uploadMultipleFiles = async (files, bucket = 'posts') => {
        setUploading(true);
        setProgress(0);
        setError(null);

        const urls = [];
        let completed = 0;

        try {
            for (const file of files) {
                const url = await uploadFile(file, bucket);
                if (url) {
                    urls.push(url);
                    completed++;
                    setProgress((completed / files.length) * 100);
                } else {
                    throw new Error(`Failed to upload ${file.name}`);
                }
            }
            return urls;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    return { uploadFile, uploadMultipleFiles, uploading, progress, error };
};
