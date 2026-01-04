/**
 * File Upload Validation Utilities
 * Use these for validating files before upload
 */

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
    avatar: 5 * 1024 * 1024,      // 5MB
    postImage: 10 * 1024 * 1024,   // 10MB
    postVideo: 100 * 1024 * 1024,  // 100MB
    message: 10 * 1024 * 1024,     // 10MB
    boltz: 50 * 1024 * 1024        // 50MB
};

// Max files per upload
export const MAX_FILES_PER_POST = 10;

/**
 * Validate a file for upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validateFile = (file, options = {}) => {
    const {
        allowedTypes = ALLOWED_MEDIA_TYPES,
        maxSize = FILE_SIZE_LIMITS.postImage,
        context = 'file'
    } = options;

    // Check if file exists
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        const allowedList = allowedTypes.map(t => t.split('/')[1]).join(', ');
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${allowedList}`
        };
    }

    // Check file size
    if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxMB}MB`
        };
    }

    return { valid: true };
};

/**
 * Validate multiple files
 * @param {FileList|File[]} files - Files to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { valid: boolean, errors: string[], validFiles: File[] }
 */
export const validateFiles = (files, options = {}) => {
    const { maxFiles = MAX_FILES_PER_POST, ...fileOptions } = options;
    const fileArray = Array.from(files);
    const errors = [];
    const validFiles = [];

    // Check total count
    if (fileArray.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return { valid: false, errors, validFiles: [] };
    }

    // Validate each file
    for (const file of fileArray) {
        const result = validateFile(file, fileOptions);
        if (result.valid) {
            validFiles.push(file);
        } else {
            errors.push(`${file.name}: ${result.error}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        validFiles
    };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if file is an image
 * @param {File} file - File to check
 * @returns {boolean}
 */
export const isImage = (file) => {
    return file && ALLOWED_IMAGE_TYPES.includes(file.type);
};

/**
 * Check if file is a video
 * @param {File} file - File to check
 * @returns {boolean}
 */
export const isVideo = (file) => {
    return file && ALLOWED_VIDEO_TYPES.includes(file.type);
};

/**
 * Generate unique filename for upload
 * @param {File} file - Original file
 * @param {string} userId - User ID for folder structure
 * @returns {string} - Unique file path
 */
export const generateUniqueFilename = (file, userId) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}/${timestamp}_${random}.${ext}`;
};
