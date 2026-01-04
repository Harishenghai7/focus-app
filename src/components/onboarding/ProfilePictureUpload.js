import React, { useState, useRef } from 'react';
import styles from './ProfilePictureUpload.module.css';
import ImageCropper from '../shared/ImageCropper';
import { FaCamera, FaUser } from 'react-icons/fa';

const ProfilePictureUpload = ({ onFileSelect }) => {
    const [preview, setPreview] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                setIsCropping(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCrop = (croppedImage) => {
        // In a real implementation, this would return a blob from the cropper
        // For now, we just use the preview and pass the original file
        setIsCropping(false);
        onFileSelect(fileInputRef.current.files[0]);
    };

    const handleCancel = () => {
        setIsCropping(false);
        setPreview(null);
        fileInputRef.current.value = '';
        onFileSelect(null);
    };

    return (
        <div className={styles.container}>
            {isCropping ? (
                <ImageCropper
                    image={preview}
                    onCrop={handleCrop}
                    onCancel={handleCancel}
                />
            ) : (
                <div
                    className={styles.uploadArea}
                    onClick={() => fileInputRef.current.click()}
                >
                    {preview ? (
                        <img src={preview} alt="Profile" className={styles.previewImage} />
                    ) : (
                        <div className={styles.placeholder}>
                            <FaUser className={styles.icon} />
                        </div>
                    )}
                    <div className={styles.overlay}>
                        <FaCamera />
                    </div>
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className={styles.hiddenInput}
            />
            {!isCropping && <p className={styles.hint}>Tap to upload profile picture</p>}
        </div>
    );
};

export default ProfilePictureUpload;
