import React, { useState } from 'react';
import styles from './MediaSelect.module.css';
import MediaPicker from '../../components/create/MediaPicker';
import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const MediaSelect = ({ mode, onNext, onBack }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleSelect = (files) => {
        // Process files to add IDs and preview URLs
        const newFiles = Array.from(files).map(file => {
            if (!file) return null;
            return {
                file,
                preview: URL.createObjectURL(file),
                id: Math.random().toString(36).substr(2, 9),
                type: file?.type?.startsWith('video') ? 'video' : 'image',
                edits: {
                    filter: 'none',
                    brightness: 100,
                    contrast: 100,
                    saturation: 100,
                    rotation: 0,
                    crop: { x: 0, y: 0 },
                    zoom: 1,
                    trim: [0, 0]
                }
            };
        }).filter(f => f != null);

        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const handleRemove = (id) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleContinue = () => {
        if (selectedFiles.length > 0) {
            onNext(selectedFiles);
        }
    };

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <div className={styles.header}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
                </Button>
                <h2>Select Media ({mode})</h2>
                {selectedFiles.length > 0 && (
                    <Button onClick={handleContinue}>
                        Next <ArrowRight size={16} />
                    </Button>
                )}
            </div>

            <div className={styles.content}>
                {selectedFiles.length === 0 ? (
                    <div className={styles.pickerWrapper}>
                        <MediaPicker mode={mode} onSelect={handleSelect} />
                    </div>
                ) : (
                    <div className={styles.previewGrid}>
                        {selectedFiles.map(item => (
                            <div key={item.id} className={styles.previewItem}>
                                {item.type === 'video' ? (
                                    <video src={item.preview} className={styles.media} />
                                ) : (
                                    <img src={item.preview} alt="Preview" className={styles.media} />
                                )}
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => handleRemove(item.id)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {selectedFiles.length < 10 && (
                            <div className={styles.addMore}>
                                <MediaPicker mode={mode} onSelect={handleSelect} compact />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default MediaSelect;
