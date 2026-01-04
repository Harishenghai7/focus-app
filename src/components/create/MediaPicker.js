import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, Image as ImageIcon, Video } from 'lucide-react';
import styles from './MediaPicker.module.css';
import Button from '../shared/Button';

const MediaPicker = ({ mode, onSelect, maxFiles = 10 }) => {
    const accept = mode === 'post'
        ? { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }
        : mode === 'boltz'
            ? { 'video/*': ['.mp4', '.mov', '.webm'] }
            : { 'image/*': [], 'video/*': [] }; // Flash accepts both

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            // Validate duration/size here if needed
            onSelect(acceptedFiles);
        }
    }, [onSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: mode === 'boltz' ? 1 : maxFiles,
        multiple: mode !== 'boltz'
    });

    return (
        <div className={styles.container}>
            <div
                {...getRootProps()}
                className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
            >
                <input {...getInputProps()} />

                <div className={styles.iconWrapper}>
                    {mode === 'boltz' ? <Video size={48} /> : <ImageIcon size={48} />}
                </div>

                <h3 className={styles.title}>
                    {isDragActive ? 'Drop files here' : 'Drag & drop media'}
                </h3>

                <p className={styles.subtitle}>
                    {mode === 'post' && 'Upload photos (max 10)'}
                    {mode === 'boltz' && 'Upload a vertical video (15-60s)'}
                    {mode === 'flash' && 'Upload photos or videos'}
                </p>

                <Button variant="secondary" className={styles.button}>
                    <Upload size={18} />
                    Select from Device
                </Button>
            </div>

            <div className={styles.divider}>
                <span>OR</span>
            </div>

            <Button variant="primary" size="lg" className={styles.cameraButton}>
                <Camera size={20} />
                Open Camera
            </Button>
        </div>
    );
};

export default MediaPicker;
