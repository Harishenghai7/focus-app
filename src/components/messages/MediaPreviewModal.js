import React, { useState, useEffect } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import styles from './MediaPreviewModal.module.css';

const MediaPreviewModal = ({ media, initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);
    const modalRef = React.useRef(null);

    useClickOutside(modalRef, onClose);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'ArrowRight') handleNext();
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [currentIndex]);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
        setIsZoomed(false);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
        setIsZoomed(false);
    };

    const handleDownload = async () => {
        const currentMedia = media[currentIndex];
        try {
            const response = await fetch(currentMedia.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentMedia.name || `media-${Date.now()}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const currentMedia = media[currentIndex];

    return (
        <div className={styles.overlay}>
            <div ref={modalRef} className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.info}>
                        <span className={styles.counter}>
                            {currentIndex + 1} / {media.length}
                        </span>
                        {currentMedia.name && (
                            <span className={styles.filename}>{currentMedia.name}</span>
                        )}
                    </div>

                    <div className={styles.actions}>
                        <button
                            className={styles.actionButton}
                            onClick={handleDownload}
                            title="Download"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <button
                            className={styles.actionButton}
                            onClick={onClose}
                            title="Close"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Media Content */}
                <div className={styles.content}>
                    {currentMedia.type === 'image' ? (
                        <img
                            src={currentMedia.url}
                            alt={currentMedia.name || 'Media'}
                            className={`${styles.image} ${isZoomed ? styles.zoomed : ''}`}
                            onClick={() => setIsZoomed(!isZoomed)}
                        />
                    ) : currentMedia.type === 'video' ? (
                        <video
                            src={currentMedia.url}
                            controls
                            autoPlay
                            className={styles.video}
                        />
                    ) : currentMedia.type === 'audio' ? (
                        <div className={styles.audioContainer}>
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-2c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <audio src={currentMedia.url} controls className={styles.audio} />
                        </div>
                    ) : (
                        <div className={styles.fileContainer}>
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="2" />
                                <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <p className={styles.fileName}>{currentMedia.name}</p>
                            <button className={styles.downloadButton} onClick={handleDownload}>
                                Download File
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                {media.length > 1 && (
                    <>
                        <button
                            className={`${styles.navButton} ${styles.prev}`}
                            onClick={handlePrevious}
                            title="Previous"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <button
                            className={`${styles.navButton} ${styles.next}`}
                            onClick={handleNext}
                            title="Next"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Thumbnails */}
                {media.length > 1 && (
                    <div className={styles.thumbnails}>
                        {media.map((item, index) => (
                            <button
                                key={index}
                                className={`${styles.thumbnail} ${index === currentIndex ? styles.active : ''}`}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setIsZoomed(false);
                                }}
                            >
                                {item.type === 'image' ? (
                                    <img src={item.url} alt={`Thumbnail ${index + 1}`} />
                                ) : item.type === 'video' ? (
                                    <div className={styles.videoThumb}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className={styles.fileThumb}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaPreviewModal;
