// ═══════════════════════════════════════════════════════════════════════
// MEDIA UPLOAD UTILITY - Messages Page
// ═══════════════════════════════════════════════════════════════════════
// Handles image/video compression, validation, and upload to Supabase Storage

import { supabase } from '../../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// ═══════════════════════════════════════════════════════════════════════
// FILE VALIDATION
// ═══════════════════════════════════════════════════════════════════════

export const validateFileType = (file, type = 'image') => {
    const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;

    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    return true;
};

export const validateFileSize = (file, type = 'image') => {
    const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    return true;
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// ═══════════════════════════════════════════════════════════════════════
// IMAGE COMPRESSION
// ═══════════════════════════════════════════════════════════════════════

export const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            }));
                        } else {
                            reject(new Error('Image compression failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};

// ═══════════════════════════════════════════════════════════════════════
// VIDEO THUMBNAIL GENERATION
// ═══════════════════════════════════════════════════════════════════════

export const generateVideoThumbnail = (file) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.onloadedmetadata = () => {
            video.currentTime = 1; // Capture at 1 second
        };

        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(new File([blob], 'thumbnail.jpg', {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    } else {
                        reject(new Error('Thumbnail generation failed'));
                    }
                },
                'image/jpeg',
                0.7
            );
        };

        video.onerror = () => reject(new Error('Failed to load video'));

        const url = URL.createObjectURL(file);
        video.src = url;
    });
};

// ═══════════════════════════════════════════════════════════════════════
// UPLOAD TO SUPABASE STORAGE
// ═══════════════════════════════════════════════════════════════════════

export const uploadToStorage = async (file, conversationId, type = 'image') => {
    try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 9);
        const extension = file.name.split('.').pop();
        const filename = `${conversationId}/${type}_${timestamp}_${randomStr}.${extension}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('message-media')
            .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('message-media')
            .getPublicUrl(data.path);

        return {
            path: data.path,
            url: urlData.publicUrl,
            size: file.size,
            type: file.type
        };
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN UPLOAD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

export const uploadImage = async (file, conversationId) => {
    try {
        // Validate
        validateFileType(file, 'image');
        validateFileSize(file, 'image');

        // Compress if needed
        let processedFile = file;
        if (file.size > MAX_IMAGE_SIZE * 0.5) {
            processedFile = await compressImage(file);
        }

        // Upload
        const result = await uploadToStorage(processedFile, conversationId, 'image');

        return {
            ...result,
            width: null, // Could extract from image if needed
            height: null
        };
    } catch (error) {
        console.error('Image upload error:', error);
        throw error;
    }
};

export const uploadVideo = async (file, conversationId) => {
    try {
        // Validate
        validateFileType(file, 'video');
        validateFileSize(file, 'video');

        // Generate thumbnail
        const thumbnail = await generateVideoThumbnail(file);
        const thumbnailResult = await uploadToStorage(thumbnail, conversationId, 'thumbnail');

        // Upload video
        const videoResult = await uploadToStorage(file, conversationId, 'video');

        return {
            ...videoResult,
            thumbnailUrl: thumbnailResult.url,
            duration: null // Could extract from video if needed
        };
    } catch (error) {
        console.error('Video upload error:', error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════════════
// BATCH UPLOAD (for multiple images)
// ═══════════════════════════════════════════════════════════════════════

export const uploadImages = async (files, conversationId) => {
    const uploads = files.map(file => uploadImage(file, conversationId));
    return Promise.all(uploads);
};

// ═══════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════

export default {
    validateFileType,
    validateFileSize,
    formatFileSize,
    compressImage,
    generateVideoThumbnail,
    uploadImage,
    uploadVideo,
    uploadImages,
    uploadToStorage
};
