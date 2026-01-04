// ═══════════════════════════════════════════════════════════════════════
// MEDIA UPLOAD UTILITY - Upload images, videos, and voice messages
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from '../../../lib/supabase';

const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_VOICE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Compress image before upload
 */
const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            }));
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

/**
 * Generate thumbnail for image
 */
const generateImageThumbnail = async (file, maxWidth = 300) => {
    return compressImage(file, maxWidth, 0.7);
};

/**
 * Validate file type
 */
export const validateFileType = (file, allowedTypes) => {
    return allowedTypes.some(type => {
        if (type.includes('*')) {
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType + '/');
        }
        return file.type === type;
    });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate thumbnail for video
 */
export const generateVideoThumbnail = async (file) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
            video.currentTime = 1; // Seek to 1 second
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(video.videoWidth, 300);
            canvas.height = (video.videoHeight * canvas.width) / video.videoWidth;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(video.src);
                    if (blob) {
                        resolve(new File([blob], 'thumbnail.jpg', {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    } else {
                        reject(new Error('Failed to generate thumbnail'));
                    }
                },
                'image/jpeg',
                0.7
            );
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error('Failed to load video'));
        };
    });
};

/**
 * Upload file to Supabase Storage
 */
const uploadFile = async (file, bucket, path) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrl;
};

/**
 * Upload image with compression and thumbnail
 */
export const uploadImage = async (file, userId) => {
    // Validate size
    if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(`Image size must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }

    // Compress image
    const compressed = await compressImage(file);

    // Generate thumbnail
    const thumbnail = await generateImageThumbnail(compressed);

    // Upload both
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const basePath = `${userId}/${timestamp}`;

    const [imageUrl, thumbnailUrl] = await Promise.all([
        uploadFile(compressed, 'messages', `${basePath}.${ext}`),
        uploadFile(thumbnail, 'messages', `${basePath}_thumb.jpg`)
    ]);

    // Get image dimensions
    const img = await createImageBitmap(compressed);

    return {
        url: imageUrl,
        thumbnailUrl,
        size: compressed.size,
        width: img.width,
        height: img.height,
        mimeType: compressed.type
    };
};

/**
 * Upload video with thumbnail
 */
export const uploadVideo = async (file, userId) => {
    // Validate size
    if (file.size > MAX_VIDEO_SIZE) {
        throw new Error(`Video size must be less than ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
    }

    // Generate thumbnail
    const thumbnail = await generateVideoThumbnail(file);

    // Upload both
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const basePath = `${userId}/${timestamp}`;

    const [videoUrl, thumbnailUrl] = await Promise.all([
        uploadFile(file, 'messages', `${basePath}.${ext}`),
        uploadFile(thumbnail, 'messages', `${basePath}_thumb.jpg`)
    ]);

    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);

    const duration = await new Promise((resolve) => {
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(Math.floor(video.duration));
        };
    });

    return {
        url: videoUrl,
        thumbnailUrl,
        size: file.size,
        duration,
        width: video.videoWidth,
        height: video.videoHeight,
        mimeType: file.type
    };
};

/**
 * Upload voice message
 */
export const uploadVoiceMessage = async (blob, userId, duration) => {
    // Validate size
    if (blob.size > MAX_VOICE_SIZE) {
        throw new Error(`Voice message size must be less than ${MAX_VOICE_SIZE / 1024 / 1024}MB`);
    }

    const timestamp = Date.now();
    const file = new File([blob], `voice_${timestamp}.webm`, {
        type: 'audio/webm',
        lastModified: timestamp
    });

    const url = await uploadFile(file, 'messages', `${userId}/${timestamp}.webm`);

    return {
        url,
        size: blob.size,
        duration,
        mimeType: 'audio/webm'
    };
};

/**
 * Upload multiple images
 */
export const uploadImages = async (files, userId) => {
    return Promise.all(files.map(file => uploadImage(file, userId)));
};

/**
 * Delete uploaded file
 */
export const deleteUploadedFile = async (url) => {
    try {
        const path = url.split('/messages/')[1];
        if (path) {
            await supabase.storage.from('messages').remove([path]);
        }
    } catch (err) {
        console.error('Error deleting file:', err);
    }
};
