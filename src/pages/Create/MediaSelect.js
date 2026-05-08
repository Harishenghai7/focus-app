import React, { useState, useCallback, useRef } from 'react';
import styles from './MediaSelect.module.css';
import MediaPicker from '../../components/create/MediaPicker';
import Button from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Film, ImageIcon, GripVertical, CheckCircle2 } from 'lucide-react';

const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getMediaBadge = (file) => {
    if (!file?.file) return null;
    const size = file.file.size;
    if (size > 50 * 1024 * 1024) return '4K';
    if (size > 10 * 1024 * 1024) return 'HD';
    return null;
};

const MediaThumbnail = ({ item, index, onRemove, isDragging, onDragStart, onDragOver, onDragEnd }) => {
    const badge = getMediaBadge(item);

    return (
        <motion.div
            className={`${styles.thumbnailCard} ${isDragging ? styles.dragging : ''}`}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
        >
            <div className={styles.thumbnailInner}>
                {/* Media preview */}
                {item.type === 'video' ? (
                    <video src={item.preview} className={styles.thumbMedia} muted />
                ) : (
                    <img src={item.preview} alt={`Media ${index + 1}`} className={styles.thumbMedia} />
                )}

                {/* Overlay info */}
                <div className={styles.thumbOverlay}>
                    <div className={styles.thumbTopRow}>
                        <span className={styles.thumbIndex}>{index + 1}</span>
                        {badge && <span className={styles.qualityBadge}>{badge}</span>}
                    </div>
                    <div className={styles.thumbBottomRow}>
                        <span className={styles.thumbType}>
                            {item.type === 'video' ? <Film size={12} /> : <ImageIcon size={12} />}
                            {item.type}
                        </span>
                        {item.file && (
                            <span className={styles.thumbSize}>{formatFileSize(item.file.size)}</span>
                        )}
                    </div>
                </div>

                {/* Drag handle */}
                <div className={styles.dragHandle}>
                    <GripVertical size={16} />
                </div>

                {/* Remove button */}
                <button
                    className={styles.removeBtn}
                    onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                >
                    <X size={14} />
                </button>

                {/* Upload success indicator */}
                <motion.div
                    className={styles.uploadSuccess}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                >
                    <CheckCircle2 size={16} />
                </motion.div>
            </div>
        </motion.div>
    );
};

const MediaSelect = ({ mode, onNext, onBack }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const fileCountRef = useRef(0);

    const handleSelect = useCallback((files) => {
        const newFiles = Array.from(files).map(file => {
            if (!file) return null;
            fileCountRef.current += 1;
            return {
                file,
                preview: URL.createObjectURL(file),
                id: `media_${Date.now()}_${fileCountRef.current}`,
                type: file?.type?.startsWith('video') ? 'video' : 'image',
                edits: {
                    filter: 'none',
                    brightness: 100,
                    contrast: 100,
                    saturation: 100,
                    rotation: 0,
                    crop: { x: 0, y: 0, width: 100, height: 100 },
                    zoom: 1,
                    trim: [0, 0]
                }
            };
        }).filter(f => f != null);

        setSelectedFiles(prev => [...prev, ...newFiles]);
    }, []);

    const handleRemove = useCallback((id) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const handleContinue = () => {
        if (selectedFiles.length > 0) {
            onNext(selectedFiles);
        }
    };

    // Drag and drop reorder handlers
    const handleDragStart = (e, index) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
            setSelectedFiles(prev => {
                const newFiles = [...prev];
                const [moved] = newFiles.splice(dragIndex, 1);
                newFiles.splice(dragOverIndex, 0, moved);
                return newFiles;
            });
        }
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const maxFiles = mode === 'boltz' ? 1 : 10;

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Header */}
            <div className={styles.header}>
                <Button variant="ghost" onClick={onBack} className={styles.backBtn}>
                    <ArrowLeft size={18} /> Back
                </Button>
                <div className={styles.headerCenter}>
                    <h2 className={styles.headerTitle}>
                        {mode === 'post' ? '📸 Select Photos' : mode === 'boltz' ? '⚡ Select Video' : '✨ Select Media'}
                    </h2>
                    {selectedFiles.length > 0 && (
                        <motion.span
                            className={styles.fileCount}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            {selectedFiles.length}/{maxFiles}
                        </motion.span>
                    )}
                </div>
                <AnimatePresence>
                    {selectedFiles.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <Button onClick={handleContinue} className={styles.nextBtn}>
                                Continue <ArrowRight size={16} />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Area */}
            <div className={styles.content}>
                {selectedFiles.length === 0 ? (
                    /* Empty state - Full dropzone */
                    <motion.div
                        className={styles.emptyState}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <MediaPicker mode={mode} onSelect={handleSelect} maxFiles={maxFiles} />
                    </motion.div>
                ) : (
                    /* Gallery grid with media */
                    <div className={styles.gallerySection}>
                        <div className={styles.galleryGrid}>
                            <AnimatePresence>
                                {selectedFiles.map((item, index) => (
                                    <MediaThumbnail
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        onRemove={handleRemove}
                                        isDragging={dragIndex === index}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDragEnd={handleDragEnd}
                                    />
                                ))}
                            </AnimatePresence>

                            {/* Add more button */}
                            {selectedFiles.length < maxFiles && (
                                <motion.div
                                    className={styles.addMoreCard}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <MediaPicker mode={mode} onSelect={handleSelect} compact maxFiles={maxFiles - selectedFiles.length} />
                                </motion.div>
                            )}
                        </div>

                        {/* Reorder hint */}
                        {selectedFiles.length > 1 && (
                            <motion.p
                                className={styles.reorderHint}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <GripVertical size={14} />
                                Drag to reorder your media
                            </motion.p>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default MediaSelect;
