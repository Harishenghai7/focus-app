import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, Image as ImageIcon, Video, Film, AlertCircle } from 'lucide-react';
import styles from './MediaPicker.module.css';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const MODE_CONFIG = {
    post: {
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'] },
        icon: ImageIcon,
        title: 'Upload Photos',
        description: 'JPEG, PNG, WebP • Up to 10 photos • Max 50MB each',
        maxFiles: 10
    },
    boltz: {
        accept: { 'video/*': ['.mp4', '.mov', '.webm'] },
        icon: Film,
        title: 'Upload Video',
        description: 'MP4, MOV, WebM • 15–60 seconds • Max 500MB',
        maxFiles: 1
    },
    flash: {
        accept: { 'image/*': [], 'video/*': [] },
        icon: Video,
        title: 'Upload Media',
        description: 'Photos or videos • Max 30 seconds for video',
        maxFiles: 1
    }
};

const MediaPicker = ({ mode, onSelect, maxFiles = 10, compact = false }) => {
    const [validationError, setValidationError] = useState(null);
    const config = MODE_CONFIG[mode] || MODE_CONFIG.post;
    const IconComponent = config.icon;

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setValidationError(null);

        if (rejectedFiles?.length > 0) {
            const firstError = rejectedFiles[0].errors[0];
            if (firstError?.code === 'file-too-large') {
                setValidationError('File is too large. Maximum size is 500MB.');
            } else if (firstError?.code === 'file-invalid-type') {
                setValidationError('Unsupported file format. Please try a different file.');
            } else {
                setValidationError(firstError?.message || 'Invalid file.');
            }
            return;
        }

        if (acceptedFiles?.length > 0) {
            onSelect(acceptedFiles);
        }
    }, [onSelect]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: config.accept,
        maxFiles: compact ? 1 : (mode === 'boltz' ? 1 : maxFiles),
        multiple: mode !== 'boltz' && !compact,
        maxSize: MAX_FILE_SIZE
    });

    const handleCameraCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            // Camera access confirmed - trigger file input with capture
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = mode === 'post' ? 'image/*' : mode === 'boltz' ? 'video/*' : 'image/*,video/*';
            input.capture = 'environment';
            input.onchange = (e) => {
                if (e.target.files?.length > 0) {
                    onSelect(Array.from(e.target.files));
                }
            };
            input.click();
        } catch (err) {
            // Camera not available — fallback silently
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = mode === 'post' ? 'image/*' : mode === 'boltz' ? 'video/*' : 'image/*,video/*';
            input.capture = 'environment';
            input.onchange = (e) => {
                if (e.target.files?.length > 0) {
                    onSelect(Array.from(e.target.files));
                }
            };
            input.click();
        }
    };

    // Compact variant for "add more" button
    if (compact) {
        return (
            <div className={styles.compactPicker}>
                <div {...getRootProps()} className={styles.compactDropzone}>
                    <input {...getInputProps()} />
                    <Upload size={24} />
                    <span>Add More</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div
                {...getRootProps()}
                className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${isDragReject ? styles.reject : ''}`}
            >
                <input {...getInputProps()} />

                {/* Animated border pulse */}
                <div className={`${styles.borderPulse} ${isDragActive ? styles.borderActive : ''}`} />

                {/* Icon area */}
                <motion.div
                    className={styles.iconArea}
                    animate={isDragActive ? { scale: 1.1, y: -8 } : { scale: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className={styles.iconCircle}>
                        <IconComponent size={36} strokeWidth={1.5} />
                    </div>
                    {isDragActive && (
                        <motion.div
                            className={styles.iconRing}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                </motion.div>

                {/* Text */}
                <h3 className={styles.title}>
                    {isDragActive ? 'Drop your files here' : isDragReject ? 'Unsupported file type' : config.title}
                </h3>
                <p className={styles.description}>{config.description}</p>

                {/* Browse button */}
                <motion.div
                    className={styles.browseBtn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Upload size={18} />
                    <span>Browse Files</span>
                </motion.div>

                {/* Validation error */}
                <AnimatePresence>
                    {validationError && (
                        <motion.div
                            className={styles.validationError}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <AlertCircle size={14} />
                            <span>{validationError}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Divider */}
            <div className={styles.divider}>
                <span>OR</span>
            </div>

            {/* Camera button */}
            <motion.button
                className={styles.cameraButton}
                onClick={handleCameraCapture}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Camera size={20} />
                <span>Open Camera</span>
            </motion.button>
        </div>
    );
};

export default MediaPicker;
