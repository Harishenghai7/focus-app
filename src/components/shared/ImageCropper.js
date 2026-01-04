import React, { useRef, useState } from 'react';
import styles from './ImageCropper.module.css';
import { FaCamera, FaTimes } from 'react-icons/fa';

const ImageCropper = ({ image, onCrop, onCancel }) => {
    // Simplified version: Just a preview with a "Save" button for now
    // A full cropper would require a library like react-easy-crop

    return (
        <div className={styles.container}>
            <div className={styles.previewArea}>
                <img src={image} alt="Preview" className={styles.image} />
            </div>
            <div className={styles.controls}>
                <button className={styles.cancelBtn} onClick={onCancel}>
                    <FaTimes /> Cancel
                </button>
                <button className={styles.saveBtn} onClick={() => onCrop(image)}>
                    <FaCamera /> Use Photo
                </button>
            </div>
        </div>
    );
};

export default ImageCropper;
