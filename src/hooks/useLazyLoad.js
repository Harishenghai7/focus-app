import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for lazy loading with Intersection Observer
 * @param {Object} options - Configuration options
 * @returns {Object} - Ref and loading state
 */
export function useLazyLoad(options = {}) {
  const {
    threshold = 0.01,
    rootMargin = '50px',
    triggerOnce = true,
  } = options;

  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            
            // Disconnect if triggerOnce is true
            if (triggerOnce && observerRef.current) {
              observerRef.current.disconnect();
            }
          } else if (!triggerOnce) {
            setIsInView(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Start observing
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return {
    ref: elementRef,
    isInView,
    isLoaded,
    setIsLoaded,
  };
}

/**
 * Custom hook for lazy loading images
 * @param {string} src - Image source URL
 * @param {Object} options - Configuration options
 * @returns {Object} - Image state and ref
 */
export function useLazyImage(src, options = {}) {
  const {
    threshold = 0.01,
    rootMargin = '50px',
    placeholderSrc = null,
  } = options;

  const [imageSrc, setImageSrc] = useState(placeholderSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const { ref, isInView } = useLazyLoad({ threshold, rootMargin });

  useEffect(() => {
    if (!isInView || !src) return;

    // Load the image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };

    img.onerror = (err) => {
      setError(err);
      console.error('Failed to load image:', src);
    };

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    error,
  };
}

/**
 * Custom hook for lazy loading multiple images
 * @param {Array<string>} sources - Array of image URLs
 * @param {Object} options - Configuration options
 * @returns {Object} - Loading state and refs
 */
export function useLazyImages(sources = [], options = {}) {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [errors, setErrors] = useState(new Map());
  const { ref, isInView } = useLazyLoad(options);

  useEffect(() => {
    if (!isInView || sources.length === 0) return;

    // Load all images
    sources.forEach((src, index) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        setLoadedImages((prev) => new Set([...prev, src]));
      };

      img.onerror = (err) => {
        setErrors((prev) => new Map([...prev, [src, err]]));
      };
    });
  }, [isInView, sources]);

  const allLoaded = loadedImages.size === sources.length;
  const hasErrors = errors.size > 0;

  return {
    ref,
    loadedImages,
    errors,
    allLoaded,
    hasErrors,
  };
}

/**
 * Custom hook for preloading images
 * @param {Array<string>} sources - Array of image URLs to preload
 */
export function usePreloadImages(sources = []) {
  const [preloadedImages, setPreloadedImages] = useState(new Set());

  useEffect(() => {
    if (sources.length === 0) return;

    sources.forEach((src) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        setPreloadedImages((prev) => new Set([...prev, src]));
      };
    });
  }, [sources]);

  return preloadedImages;
}

export default useLazyLoad;
