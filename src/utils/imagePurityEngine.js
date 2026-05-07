/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔱 IMAGE PURIFICATION ENGINE — Trust Shield Layer 1
 * OpenCV.js On-Device Pre-Processing Pipeline
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Pipeline (executed before Tesseract OCR):
 *   1. Load OpenCV.js from CDN (one-time, cached on window.cv)
 *   2. Auto-detect card edges (Canny → findContours → getPerspectiveTransform)
 *   3. Perspective-warp to flat rectangle
 *   4. Grayscale conversion (cv.COLOR_RGBA2GRAY)
 *   5. Gaussian Blur (kernel 3×3) — noise reduction
 *   6. Adaptive Threshold (GAUSSIAN_C, THRESH_BINARY) — text pops
 *
 * Falls back gracefully when:
 *   - OpenCV CDN unavailable (returns original canvas)
 *   - No clear card contour found (omits perspective step)
 *   - Any OpenCV runtime error (returns original canvas)
 *
 * Usage:
 *   const { canvas, dataUrl, method } = await preprocessIDImage(imgElement);
 */

// ── OpenCV CDN Loader ───────────────────────────────────────────────────────
const OPENCV_CDN = 'https://docs.opencv.org/4.x/opencv.js';
const OPENCV_TIMEOUT_MS = 8000; // 8 seconds max wait

let _cvLoadPromise = null;

/**
 * Load OpenCV.js from CDN — singleton, cached on window.cv
 * @returns {Promise<boolean>} true if loaded successfully
 */
export const loadOpenCV = () => {
  // Already loaded
  if (typeof window !== 'undefined' && window.cv && window.cv.Mat) {
    return Promise.resolve(true);
  }

  // Already in flight
  if (_cvLoadPromise) return _cvLoadPromise;

  _cvLoadPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[OpenCV] CDN timeout — purification will use fallback pipeline');
      resolve(false);
    }, OPENCV_TIMEOUT_MS);

    const script = document.createElement('script');
    script.src = OPENCV_CDN;
    script.async = true;

    script.onload = () => {
      // OpenCV.js calls onRuntimeInitialized when fully ready
      if (window.cv && window.cv.Mat) {
        clearTimeout(timeout);

        resolve(true);
        return;
      }
      // Wait for async WASM compilation
      const prior = window.cv?.onRuntimeInitialized;
      const handler = () => {
        clearTimeout(timeout);
        if (prior) prior();

        resolve(true);
      };
      if (window.cv) {
        window.cv.onRuntimeInitialized = handler;
      } else {
        // Polling fallback
        const poll = setInterval(() => {
          if (window.cv && window.cv.Mat) {
            clearInterval(poll);
            clearTimeout(timeout);

            resolve(true);
          }
        }, 200);
      }
    };

    script.onerror = () => {
      clearTimeout(timeout);
      console.warn('[OpenCV] Script load failed — using fallback pipeline');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return _cvLoadPromise;
};

// ── Canvas helper: Image/File → HTMLImageElement ────────────────────────────
export const fileToImageElement = (source) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (source instanceof File || source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof HTMLImageElement) {
      resolve(source);
    } else if (source instanceof HTMLCanvasElement) {
      resolve(source);
    } else {
      reject(new Error('Unsupported image source'));
    }
  });

// ── Luminance check on canvas ───────────────────────────────────────────────
export const measureLuminance = (canvas) => {
  try {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const sample = 32;
    const px = ctx.getImageData(0, 0, Math.min(width, sample), Math.min(height, sample)).data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) {
      sum += (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
    }
    return sum / (px.length / 4);
  } catch {
    return 1.0;
  }
};

// ── Core: OpenCV pipeline ───────────────────────────────────────────────────

/**
 * Run the full OpenCV ID purification pipeline on a source image.
 *
 * @param {File|HTMLImageElement|HTMLCanvasElement|string} source
 * @param {object} [opts]
 * @param {boolean} [opts.skipPerspective=false]  Skip card-edge detection (faster)
 * @param {Function} [opts.onProgress]            Progress callback (0-100)
 * @returns {Promise<{canvas: HTMLCanvasElement, dataUrl: string, method: string, luminance: number}>}
 */
export const preprocessIDImage = async (source, opts = {}) => {
  const { skipPerspective = false, onProgress } = opts;
  const progress = (n) => onProgress && onProgress(n);

  // ── Step 0: Convert source → canvas ──────────────────────────────────────
  progress(5);
  let srcCanvas;
  try {
    const img = await fileToImageElement(source);
    srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.naturalWidth || img.width || 800;
    srcCanvas.height = img.naturalHeight || img.height || 600;
    const ctx = srcCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, srcCanvas.width, srcCanvas.height);
  } catch {
    // Return blank canvas as last resort
    srcCanvas = document.createElement('canvas');
    srcCanvas.width = 800;
    srcCanvas.height = 600;
  }

  const luminance = measureLuminance(srcCanvas);
  progress(15);

  // ── Load OpenCV ───────────────────────────────────────────────────────────
  const cvAvailable = await loadOpenCV();
  if (!cvAvailable || !window.cv || !window.cv.Mat) {
    // Fallback: apply CSS-style filter via canvas 2D API
    progress(100);
    return {
      canvas: applyFallbackFilter(srcCanvas),
      dataUrl: applyFallbackFilter(srcCanvas).toDataURL('image/jpeg', 0.95),
      method: 'fallback_css',
      luminance,
    };
  }

  const cv = window.cv;
  progress(25);

  // ── Step 1: Load into OpenCV Mat ─────────────────────────────────────────
  let src, gray, blurred, thresh, result;
  try {
    src = cv.imread(srcCanvas);
    progress(35);

    // ── Step 2: Grayscale ─────────────────────────────────────────────────
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    progress(45);

    // ── Step 3: Gaussian Blur (Noise Reduction) ───────────────────────────
    blurred = new cv.Mat();
    const ksize = new cv.Size(3, 3);
    cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);
    progress(55);

    // ── Step 4: Perspective Warp (flatten card angles) ────────────────────
    let warped = blurred.clone();

    if (!skipPerspective) {
      try {
        const edges = new cv.Mat();
        cv.Canny(blurred, edges, 50, 150);

        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let bestContour = null;
        let bestArea = 0;
        const imgArea = blurred.rows * blurred.cols;

        for (let i = 0; i < contours.size(); i++) {
          const cnt = contours.get(i);
          const area = cv.contourArea(cnt);

          if (area >= imgArea * 0.30) {
            const peri = cv.arcLength(cnt, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

            if (approx.rows === 4 && area > bestArea) {
              bestArea = area;
              if (bestContour) bestContour.delete();
              bestContour = approx;
            } else {
              approx.delete();
            }
          }
          cnt.delete();
        }

        edges.delete();
        contours.delete();
        hierarchy.delete();

        if (bestContour) {
          const points = [];
          for (let i = 0; i < 4; i++) {
            points.push({ x: bestContour.data32S[i * 2], y: bestContour.data32S[i * 2 + 1] });
          }
          bestContour.delete();

          points.sort((a, b) => a.y - b.y);
          const top = points.slice(0, 2).sort((a, b) => a.x - b.x);
          const bot = points.slice(2, 4).sort((a, b) => a.x - b.x);
          const [tl, tr, bl, br] = [top[0], top[1], bot[0], bot[1]];

          const w = Math.max(Math.hypot(tr.x - tl.x, tr.y - tl.y), Math.hypot(br.x - bl.x, br.y - bl.y));
          const h = Math.max(Math.hypot(bl.x - tl.x, bl.y - tl.y), Math.hypot(br.x - tr.x, br.y - tr.y));

          const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
          const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]);

          const perspectiveMatrix = cv.getPerspectiveTransform(srcPts, dstPts);
          const tempWarped = new cv.Mat();
          cv.warpPerspective(blurred, tempWarped, perspectiveMatrix, new cv.Size(w, h));
          
          srcPts.delete();
          dstPts.delete();
          perspectiveMatrix.delete();
          warped.delete(); // Free the clone
          warped = tempWarped;
        }
      } catch (perspErr) {
        console.warn('[OpenCV] Perspective transform skipped:', perspErr.message);
      }
    }
    progress(75);

    // ── Step 5: Adaptive Thresholding ─────────────────────────────────────
    thresh = new cv.Mat();
    cv.adaptiveThreshold(
      warped,
      thresh,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    );
    progress(85);

    // ── Step 6: Write result to output canvas ─────────────────────────────
    result = document.createElement('canvas');
    result.width = thresh.cols || srcCanvas.width;
    result.height = thresh.rows || srcCanvas.height;
    cv.imshow(result, thresh);
    progress(95);

    // ── Cleanup ───────────────────────────────────────────────────────────
    src.delete();
    gray.delete();
    blurred.delete();
    warped.delete();
    thresh.delete();

    progress(100);

    return {
      canvas: result,
      dataUrl: result.toDataURL('image/jpeg', 0.95),
      method: 'opencv_full',
      luminance,
    };
  } catch (err) {
    // Cleanup any allocated Mats
    try { src?.delete(); } catch {}
    try { gray?.delete(); } catch {}
    try { blurred?.delete(); } catch {}
    try { thresh?.delete(); } catch {}

    console.warn('[OpenCV] Pipeline error — using fallback:', err.message);
    progress(100);
    return {
      canvas: applyFallbackFilter(srcCanvas),
      dataUrl: applyFallbackFilter(srcCanvas).toDataURL('image/jpeg', 0.95),
      method: 'fallback_error',
      luminance,
    };
  }
};

// ── Fallback: CSS-style 2D canvas filter ───────────────────────────────────

/**
 * Simple grayscale + contrast boost using 2D canvas API.
 * Used when OpenCV is unavailable.
 */
const applyFallbackFilter = (srcCanvas) => {
  const out = document.createElement('canvas');
  out.width = srcCanvas.width;
  out.height = srcCanvas.height;
  const ctx = out.getContext('2d');

  // Grayscale + contrast
  ctx.filter = 'grayscale(100%) contrast(140%) brightness(110%)';
  ctx.drawImage(srcCanvas, 0, 0);

  return out;
};

/**
 * Quick helper — preprocess a File before passing to Tesseract.
 * Returns a canvas element ready to feed to worker.recognize()
 *
 * @param {File|HTMLImageElement|string} source
 * @param {Function} [onProgress] 0-100 callback
 * @returns {Promise<{canvas, dataUrl, method, luminance}>}
 */
export const purifyIDImage = async (source, onProgress) => {
  return preprocessIDImage(source, {
    skipPerspective: false,
    onProgress,
  });
};

export default { loadOpenCV, preprocessIDImage, purifyIDImage, measureLuminance, fileToImageElement };
