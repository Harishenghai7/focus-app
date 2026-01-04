import React, { useState } from 'react';
import styles from './PostMedia.module.css';
import Icon from '../ui/Icon';
import VideoPlayer from './VideoPlayer';

const PostMedia = ({ media, onDoubleTap }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showHeart, setShowHeart] = useState(false);

    // Ensure media is always an array
    const mediaItems = Array.isArray(media) ? media : [media];

    const handleDoubleTap = (e) => {
        e.preventDefault();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
        onDoubleTap();
    };

    const nextSlide = (e) => {
        e.stopPropagation();
        if (currentIndex < mediaItems.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prevSlide = (e) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    return (
        <div className={styles.container} onDoubleClick={handleDoubleTap}>
            <div
                className={styles.slider}
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {mediaItems.map((item, index) => (
                    <div key={index} className={styles.slide}>
                        {item.type === 'video' ? (
                            <VideoPlayer src={item.url} />
                        ) : (
                            <img src={item.url} alt={`Post content ${index + 1}`} className={styles.media} />
                        )}
                    </div>
                ))}
            </div>

            {showHeart && (
                <div className={styles.heartOverlay}>
                    <Icon name="Heart" size={80} color="white" fill="white" />
                </div>
            )}

            {mediaItems.length > 1 && (
                <>
                    {currentIndex > 0 && (
                        <button className={`${styles.navBtn} ${styles.prev}`} onClick={prevSlide}>
                            <Icon name="ChevronLeft" size={20} color="white" />
                        </button>
                    )}
                    {currentIndex < mediaItems.length - 1 && (
                        <button className={`${styles.navBtn} ${styles.next}`} onClick={nextSlide}>
                            <Icon name="ChevronRight" size={20} color="white" />
                        </button>
                    )}

                    <div className={styles.dots}>
                        {mediaItems.map((_, idx) => (
                            <div
                                key={idx}
                                className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default PostMedia;
