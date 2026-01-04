import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

export const useAttachmentUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = async (file, userId) => {
        try {
            setUploading(true);
            setProgress(0);

            // Determine file type
            const fileType = file.type.split('/')[0]; // image, video, audio, etc.
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload to Supabase storage
            const { data, error } = await supabase.storage
                .from('message-attachments')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    }
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('message-attachments')
                .getPublicUrl(fileName);

            setProgress(100);

            return {
                url: publicUrl,
                type: fileType,
                name: file.name,
                size: file.size,
                mimeType: file.type
            };
        } catch (err) {
            console.error('Error uploading file:', err);
            focusToast.error('Failed to upload file');
            throw err;
        } finally {
            setUploading(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const uploadMultiple = async (files, userId) => {
        try {
            setUploading(true);
            const uploads = await Promise.all(
                Array.from(files).map(file => uploadFile(file, userId))
            );
            return uploads;
        } catch (err) {
            console.error('Error uploading multiple files:', err);
            throw err;
        }
    };

    return {
        uploadFile,
        uploadMultiple,
        uploading,
        progress
    };
};
