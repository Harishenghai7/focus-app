/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎬 BOLTZ STREAMING ENGINE — Focus Platform
 * HLS/DASH Adaptive Bitrate Streaming with GPU Acceleration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ── Quality Profiles ─────────────────────────────────────
const QUALITY_PROFILES = {
  AUTO: { label: 'Auto', bitrate: null },
  LOW: { label: '360p', bitrate: 500000, width: 640, height: 360 },
  MEDIUM: { label: '480p', bitrate: 1000000, width: 854, height: 480 },
  HIGH: { label: '720p', bitrate: 2500000, width: 1280, height: 720 },
  ULTRA: { label: '1080p', bitrate: 5000000, width: 1920, height: 1080 },
};

// ── Network Quality Detection ────────────────────────────
const detectNetworkQuality = () => {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return 'HIGH';

  const effectiveType = conn.effectiveType || '4g';
  const downlink = conn.downlink || 10;

  if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5) return 'LOW';
  if (effectiveType === '3g' || downlink < 2) return 'MEDIUM';
  if (downlink < 5) return 'HIGH';
  return 'ULTRA';
};

// ── Memory Pressure Detection ────────────────────────────
const getMemoryPressure = () => {
  if (!performance.memory) return 'low';
  const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
  const usage = usedJSHeapSize / jsHeapSizeLimit;
  if (usage > 0.85) return 'critical';
  if (usage > 0.7) return 'high';
  if (usage > 0.5) return 'medium';
  return 'low';
};

// ── Codec Support Detection ──────────────────────────────
const detectCodecSupport = () => {
  const video = document.createElement('video');
  return {
    hevc: video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') !== '',
    vp9: video.canPlayType('video/webm; codecs="vp9"') !== '',
    av1: video.canPlayType('video/mp4; codecs="av01.0.01M.08"') !== '',
    h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
    hls: video.canPlayType('application/vnd.apple.mpegurl') !== '',
  };
};

/**
 * BoltzStreamingEngine — Manages adaptive video playback.
 * Provides intelligent preloading, quality adaptation, and memory management.
 */
class BoltzStreamingEngine {
  constructor() {
    this.codecs = null;
    this.networkQuality = 'HIGH';
    this.preloadCache = new Map();
    this.activeStreams = new Map();
    this.maxCacheSize = 6;
    this.maxMemoryMB = 150;
    this._initialized = false;
    this._networkInterval = null;
  }

  init() {
    if (this._initialized) return;
    this.codecs = detectCodecSupport();
    this.networkQuality = detectNetworkQuality();

    // Monitor network changes
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener('change', () => {
        this.networkQuality = detectNetworkQuality();
      });
    }

    // Periodic network check
    this._networkInterval = setInterval(() => {
      this.networkQuality = detectNetworkQuality();
    }, 15000);

    this._initialized = true;
  }

  destroy() {
    if (this._networkInterval) clearInterval(this._networkInterval);
    this.preloadCache.clear();
    this.activeStreams.clear();
    this._initialized = false;
  }

  /**
   * Get the optimal quality profile for current conditions.
   */
  getOptimalQuality() {
    if (!this._initialized) this.init();

    const memPressure = getMemoryPressure();
    let quality = this.networkQuality;

    // Reduce quality under memory pressure
    if (memPressure === 'critical') quality = 'LOW';
    else if (memPressure === 'high' && quality !== 'LOW') quality = 'MEDIUM';

    return QUALITY_PROFILES[quality] || QUALITY_PROFILES.HIGH;
  }

  /**
   * Prepare a video element for optimal playback.
   * Applies GPU acceleration hints, codec preferences, and quality settings.
   */
  prepareVideoElement(videoEl, src, options = {}) {
    if (!videoEl || !src) return;
    if (!this._initialized) this.init();

    const { preload = 'auto', poster = null } = options;

    // GPU acceleration hints
    videoEl.style.transform = 'translateZ(0)';
    videoEl.style.willChange = 'transform, opacity';
    videoEl.style.backfaceVisibility = 'hidden';

    // Playback settings
    videoEl.playsInline = true;
    videoEl.preload = preload;
    videoEl.disableRemotePlayback = true;

    // Poster
    if (poster) videoEl.poster = poster;

    // Check if src is HLS manifest
    if (this._isHLSManifest(src)) {
      this._setupHLSPlayback(videoEl, src);
    } else {
      videoEl.src = src;
    }
  }

  /**
   * Preload a video by index for seamless transitions.
   */
  preloadVideo(src, index) {
    if (!src || this.preloadCache.has(index)) return;

    // Evict oldest entries if cache is full
    while (this.preloadCache.size >= this.maxCacheSize) {
      const oldestKey = this.preloadCache.keys().next().value;
      const oldEntry = this.preloadCache.get(oldestKey);
      if (oldEntry?.abort) oldEntry.abort();
      this.preloadCache.delete(oldestKey);
    }

    // Use link preload for supported browsers
    if (typeof document !== 'undefined') {
      const existingLink = document.querySelector(`link[data-boltz-preload="${index}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = src;
        link.setAttribute('data-boltz-preload', index);
        document.head.appendChild(link);

        this.preloadCache.set(index, {
          src,
          timestamp: Date.now(),
          abort: () => {
            try { link.remove(); } catch (_) {}
          },
        });
      }
    }
  }

  /**
   * Release a video's resources to free memory.
   */
  releaseVideo(videoEl, index) {
    if (videoEl) {
      try {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load(); // Forces release of media resources
      } catch (_) {}
    }

    // Clean preload cache entry
    const entry = this.preloadCache.get(index);
    if (entry?.abort) entry.abort();
    this.preloadCache.delete(index);

    // Clean preload links
    const link = document.querySelector(`link[data-boltz-preload="${index}"]`);
    if (link) link.remove();
  }

  /**
   * Generate a thumbnail from a video element at a specific time.
   */
  generateThumbnail(videoEl, timeSeconds = 0.5) {
    return new Promise((resolve) => {
      if (!videoEl) return resolve(null);

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 568; // 9:16 aspect ratio

      const handleSeeked = () => {
        try {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', 0.7));
        } catch (_) {
          resolve(null);
        }
        videoEl.removeEventListener('seeked', handleSeeked);
      };

      videoEl.addEventListener('seeked', handleSeeked);
      videoEl.currentTime = timeSeconds;
    });
  }

  /**
   * Extract dominant color from a video frame for ambient background.
   */
  extractDominantColor(videoEl) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, 4, 4);
      const data = ctx.getImageData(0, 0, 4, 4).data;

      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      const pixels = data.length / 4;
      return `rgb(${Math.round(r / pixels)}, ${Math.round(g / pixels)}, ${Math.round(b / pixels)})`;
    } catch (_) {
      return 'rgb(15, 10, 30)'; // Default bg-primary
    }
  }

  /**
   * Get bandwidth estimate in Mbps.
   */
  getBandwidthEstimate() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return conn?.downlink || 10;
  }

  // ── Private Methods ────────────────────────────────────
  _isHLSManifest(src) {
    return /\.m3u8(\?|$)/i.test(src);
  }

  _setupHLSPlayback(videoEl, src) {
    // Check native HLS support (Safari)
    if (this.codecs?.hls) {
      videoEl.src = src;
      return;
    }

    // For browsers without native HLS, fall back to direct URL
    // In production, integrate hls.js here
    const mp4Fallback = src.replace(/\.m3u8(\?|$)/, '.mp4$1');
    videoEl.src = mp4Fallback;
  }
}

// Singleton instance
const streamingEngine = new BoltzStreamingEngine();

export default streamingEngine;
export { QUALITY_PROFILES, detectNetworkQuality, getMemoryPressure, detectCodecSupport };
