/**
 * MediaCarousel Component
 * Swipeable image/video carousel with pinch-to-zoom
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from './MediaCarousel.module.css';

const MediaCarousel = ({ media, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const carouselRef = useRef(null);

    const minSwipeDistance = 50;

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % media.length);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    // Touch handlers for swipe
    const onTouchStart = (e) => {
        setTouchEnd(0);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToNext();
        } else if (isRightSwipe) {
            goToPrevious();
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!media || media.length === 0) return null;
    if (media.length === 1) {
        return (
            <div className={styles.singleMedia} onClick={onImageClick}>
                <img src={media[0]} alt="Post" className={styles.image} />
            </div>
        );
    }

    return (
        <div
            className={styles.carousel}
            ref={carouselRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div
                className={styles.carouselTrack}
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {media.map((src, index) => (
                    <div key={index} className={styles.slide} onClick={onImageClick}>
                        <img src={src} alt={`Slide ${index + 1}`} className={styles.image} />
                    </div>
                ))}
            </div>

            {/* Navigation arrows */}
            {currentIndex > 0 && (
                <button
                    className={`${styles.navBtn} ${styles.prevBtn}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        goToPrevious();
                    }}
                    aria-label="Previous"
                >
                    ‹
                </button>
            )}
            {currentIndex < media.length - 1 && (
                <button
                    className={`${styles.navBtn} ${styles.nextBtn}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        goToNext();
                    }}
                    aria-label="Next"
                >
                    ›
                </button>
            )}

            {/* Dot indicators */}
            <div className={styles.indicators}>
                {media.map((_, index) => (
                    <button
                        key={index}
                        className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            goToSlide(index);
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default MediaCarousel;
