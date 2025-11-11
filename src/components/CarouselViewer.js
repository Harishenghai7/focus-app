import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LazyImage from './LazyImage';
import './CarouselViewer.css';

export default function CarouselViewer({ 
  mediaUrls = [], 
  mediaTypes = [], 
  autoPlay = false, 
  showControls = true,
  onIndexChange 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const totalItems = mediaUrls.length;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // Notify parent of index changes
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(currentIndex);
    }
  }, [currentIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalItems - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      setIsVideoPlaying(false);
    }
  }, [currentIndex, totalItems]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      setIsVideoPlaying(false);
    }
  }, [currentIndex]);

  const handleDotClick = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setIsVideoPlaying(false);
  };

  // Swipe detection
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  if (!mediaUrls || mediaUrls.length === 0) {
    return (
      <div className="carousel-viewer carousel-error">
        <p>No media available</p>
      </div>
    );
  }

  const currentMediaType = mediaTypes[currentIndex] || 'image';
  const currentMediaUrl = mediaUrls[currentIndex];

  return (
    <div className="carousel-viewer">
      <div className="carousel-container">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                handleNext();
              } else if (swipe > swipeConfidenceThreshold) {
                handlePrevious();
              }
            }}
            className="carousel-slide"
          >
            {currentMediaType === 'video' ? (
              <video
                src={currentMediaUrl}
                controls
                className="carousel-media carousel-video"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onError={(e) => {
                  console.error('Video load error:', e);
                  e.target.classList.add('media-error');
                }}
              />
            ) : (
              <LazyImage
                src={currentMediaUrl}
                alt={`Slide ${currentIndex + 1}`}
                className="carousel-media carousel-image"
                threshold={0.1}
                rootMargin="50px"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        {showControls && totalItems > 1 && (
          <>
            {/* Previous Button */}
            {currentIndex > 0 && (
              <button
                className="carousel-nav carousel-nav-prev"
                onClick={handlePrevious}
                aria-label="Previous"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next Button */}
            {currentIndex < totalItems - 1 && (
              <button
                className="carousel-nav carousel-nav-next"
                onClick={handleNext}
                aria-label="Next"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Position Counter */}
            <div className="carousel-counter">
              {currentIndex + 1}/{totalItems}
            </div>

            {/* Dot Indicators */}
            <div className="carousel-dots">
              {mediaUrls.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => handleDotClick(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
