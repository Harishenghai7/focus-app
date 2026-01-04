import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './MediaUploader.module.css';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

const MediaUploader = ({ onFileSelect, selectedFile }) => {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const previewUrl = URL.createObjectURL(file);
            onFileSelect({ file, previewUrl });
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'video/*': []
        },
        maxFiles: 1
    });

    if (selectedFile) {
        return (
            <div className={styles.previewContainer}>
                {selectedFile.file.type.startsWith('video') ? (
                    <video src={selectedFile.previewUrl} className={styles.preview} controls />
                ) : (
                    <img src={selectedFile.previewUrl} alt="Preview" className={styles.preview} />
                )}
                <Button
                    variant="ghost"
                    className={styles.removeBtn}
                    onClick={() => onFileSelect(null)}
                >
                    <Icon name="X" size={20} />
                </Button>
            </div>
        );
    }

    return (
        <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
            <input {...getInputProps()} />
            <Icon name="UploadCloud" size={48} className={styles.icon} />
            <p className={styles.text}>
                {isDragActive ? 'Drop the file here' : 'Drag & drop media here, or click to select'}
            </p>
            <p className={styles.subtext}>Supports JPG, PNG, MP4</p>
        </div>
    );
};

export default MediaUploader;
