import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

/**
 * LazyImage Component
 * Lazy loads images using Intersection Observer with blur-up placeholder
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  placeholderSrc = null,
  threshold = 0.01,
  rootMargin = '50px',
  onLoad = null,
  aspectRatio = null,
  ...props
}) {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || null);
  const [imageRef, setImageRef] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!imageRef || !src) return;

    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Disconnect observer once image is in view
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Start observing
    observerRef.current.observe(imageRef);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [imageRef, src, threshold, rootMargin]);

  useEffect(() => {
    if (!isInView || !src) return;

    // Load the actual image
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      if (onLoad) {
        onLoad();
      }
    };

    img.onerror = () => {
      console.error('Failed to load image:', src);
      // Keep placeholder or show error state
    };
  }, [isInView, src, onLoad]);

  const containerStyle = aspectRatio
    ? { paddingBottom: `${(1 / aspectRatio) * 100}%` }
    : {};

  return (
    <div
      ref={setImageRef}
      className={`lazy-image-container ${className}`}
      style={containerStyle}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'lazy-image-loaded' : 'lazy-image-loading'}`}
          loading="lazy"
          {...props}
        />
      ) : (
        <div className="lazy-image-placeholder">
          <div className="lazy-image-spinner"></div>
        </div>
      )}
    </div>
  );
}

/**
 * LazyBackgroundImage Component
 * Lazy loads background images
 */
export function LazyBackgroundImage({
  src,
  children,
  className = '',
  threshold = 0.01,
  rootMargin = '50px',
  ...props
}) {
  const [backgroundImage, setBackgroundImage] = useState('none');
  const [elementRef, setElementRef] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!elementRef || !src) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load the image
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              setBackgroundImage(`url(${src})`);
              setIsLoaded(true);
            };

            // Disconnect observer
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(elementRef);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [elementRef, src, threshold, rootMargin]);

  return (
    <div
      ref={setElementRef}
      className={`lazy-background ${className} ${isLoaded ? 'lazy-background-loaded' : ''}`}
      style={{ backgroundImage }}
      {...props}
    >
      {children}
    </div>
  );
}
