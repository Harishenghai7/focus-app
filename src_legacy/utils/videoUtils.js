/**
 * Video Utilities for Boltz Video Enhancements
 * Handles auto-play, compression, thumbnail generation, and view tracking
 */

/**
 * Create an Intersection Observer to detect when video enters/exits viewport
 * @param {Function} onIntersect - Callback when intersection changes
 * @param {Object} options - Intersection Observer options
 * @returns {IntersectionObserver}
 */
export const createVideoObserver = (onIntersect, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5, // Video must be 50% visible to trigger
  };

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      onIntersect(entry);
    });
  }, { ...defaultOptions, ...options });
};

/**
 * Auto-play video when it enters viewport, pause when it leaves
 * @param {HTMLVideoElement} videoElement
 * @param {Function} onVisibilityChange - Optional callback for visibility changes
 * @returns {IntersectionObserver}
 */
export const setupAutoPlay = (videoElement, onVisibilityChange = null) => {
  if (!videoElement) return null;

  const observer = createVideoObserver((entry) => {
    const isVisible = entry.isIntersecting;
    
    if (isVisible) {
      // Video entered viewport - play it
      videoElement.play().catch((error) => {
      });
    } else {
      // Video left viewport - pause it
      videoElement.pause();
    }

    // Call optional callback
    if (onVisibilityChange) {
      onVisibilityChange(isVisible, entry);
    }
  });

  observer.observe(videoElement);
  return observer;
};

/**
 * Compress video file for upload using MediaRecorder API
 * @param {File} file - Video file to compress
 * @param {Object} options - Compression options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Blob>}
 */
export const compressVideo = async (file, options = {}, onProgress = null) => {
  const {
    maxSizeMB = 50,
    maxWidthOrHeight = 1920,
    videoBitrate = 2500000, // 2.5 Mbps
  } = options;

  // Check if file is already under size limit
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= maxSizeMB) {
    if (onProgress) onProgress(100);
    return file;
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.preload = 'metadata';
    video.muted = true;

    video.addEventListener('loadedmetadata', async () => {
      try {
        // Calculate scaled dimensions
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Create MediaStream from canvas
        const stream = canvas.captureStream(30); // 30 FPS
        
        // Get audio track from original video if available
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        
        // Add audio track to stream if available
        if (destination.stream.getAudioTracks().length > 0) {
          stream.addTrack(destination.stream.getAudioTracks()[0]);
        }

        // Setup MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: videoBitrate,
        });

        const chunks = [];
        let recordedDuration = 0;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const compressedSizeMB = blob.size / (1024 * 1024);
          // If still too large, return original
          if (compressedSizeMB > maxSizeMB) {
            resolve(file);
          } else {
            resolve(blob);
          }
          
          audioContext.close();
        };

        mediaRecorder.onerror = (error) => {
          audioContext.close();
          reject(error);
        };

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms

        // Play video and draw frames to canvas
        video.play();
        
        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            if (onProgress) onProgress(100);
            return;
          }

          ctx.drawImage(video, 0, 0, width, height);
          
          // Update progress
          recordedDuration = video.currentTime;
          const progress = (recordedDuration / video.duration) * 100;
          if (onProgress) onProgress(Math.min(progress, 99));

          requestAnimationFrame(drawFrame);
        };

        video.addEventListener('playing', () => {
          drawFrame();
        });

      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', (error) => {
      reject(new Error('Failed to load video for compression'));
    });

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Generate thumbnail from video at specific time
 * @param {File|string} videoSource - Video file or URL
 * @param {number} timeInSeconds - Time to capture frame (default: 1 second)
 * @param {Object} dimensions - Thumbnail dimensions
 * @returns {Promise<Blob>}
 */
export const generateThumbnail = (videoSource, timeInSeconds = 1, dimensions = { width: 640, height: 1138 }) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      // Set canvas dimensions
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // Seek to the specified time
      video.currentTime = Math.min(timeInSeconds, video.duration);
    });

    video.addEventListener('seeked', () => {
      try {
        // Calculate aspect ratio and draw video frame
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (videoAspect > canvasAspect) {
          // Video is wider - fit height
          drawHeight = canvas.height;
          drawWidth = drawHeight * videoAspect;
          offsetX = (canvas.width - drawWidth) / 2;
        } else {
          // Video is taller - fit width
          drawWidth = canvas.width;
          drawHeight = drawWidth / videoAspect;
          offsetY = (canvas.height - drawHeight) / 2;
        }

        context.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.85);
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', (error) => {
      reject(new Error('Failed to load video: ' + error.message));
    });

    // Load video source
    if (videoSource instanceof File) {
      video.src = URL.createObjectURL(videoSource);
    } else {
      video.src = videoSource;
    }
  });
};

/**
 * Track video view after specified duration
 * @param {HTMLVideoElement} videoElement
 * @param {string} videoId
 * @param {Function} onViewTracked - Callback when view is tracked
 * @param {number} requiredDuration - Duration in seconds before tracking (default: 3)
 * @returns {Function} Cleanup function
 */
export const trackVideoView = (videoElement, videoId, onViewTracked, requiredDuration = 3) => {
  if (!videoElement || !videoId) return () => {};

  let viewTracked = false;
  let watchTime = 0;
  let intervalId = null;

  const startTracking = () => {
    if (viewTracked) return;

    intervalId = setInterval(() => {
      if (!videoElement.paused) {
        watchTime += 0.5;

        if (watchTime >= requiredDuration && !viewTracked) {
          viewTracked = true;
          clearInterval(intervalId);
          
          if (onViewTracked) {
            onViewTracked(videoId, watchTime);
          }
        }
      }
    }, 500); // Check every 500ms
  };

  const stopTracking = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // Start tracking when video plays
  videoElement.addEventListener('play', startTracking);
  videoElement.addEventListener('pause', stopTracking);
  videoElement.addEventListener('ended', stopTracking);

  // Return cleanup function
  return () => {
    stopTracking();
    videoElement.removeEventListener('play', startTracking);
    videoElement.removeEventListener('pause', stopTracking);
    videoElement.removeEventListener('ended', stopTracking);
  };
};

/**
 * Preload video for smooth playback
 * @param {string} videoUrl
 * @returns {Promise<void>}
 */
export const preloadVideo = (videoUrl) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    
    video.addEventListener('canplaythrough', () => {
      resolve();
    }, { once: true });

    video.addEventListener('error', (error) => {
      reject(error);
    }, { once: true });

    video.src = videoUrl;
  });
};

/**
 * Format video duration to MM:SS
 * @param {number} seconds
 * @returns {string}
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get video metadata
 * @param {File} file
 * @returns {Promise<Object>}
 */
export const getVideoMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      });
      URL.revokeObjectURL(video.src);
    });

    video.addEventListener('error', (error) => {
      reject(error);
      URL.revokeObjectURL(video.src);
    });

    video.src = URL.createObjectURL(file);
  });
};
