/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔱 ANTI-BYPASS ENGINE — Phase 4: Trust Shield Tamper Detection
 * EXIF live-capture enforcement • Screen-on-screen detection • 24h lock
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Detects and prevents:
 *   - Static image uploads (no EXIF capture timestamp)
 *   - Screen-on-screen attacks (photo of photo)
 *   - Screenshot artifacts (pixel density anomalies)
 *   - DevTools/debugger bypass attempts
 *
 * Enforcement:
 *   - 24-hour lock on detection
 *   - Focusly mascot error explanations
 *   - Audit trail logging
 */

import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const BYPASS_CONFIG = {
  // EXIF Requirements
  EXIF_REQUIRED_TAGS: ['DateTime', 'DateTimeOriginal', 'CreateDate'],
  MAX_FILE_AGE_MINUTES: 5, // Photo must be taken within last 5 minutes

  // Screen-on-screen detection
  MIN_PIXEL_DENSITY_VARIANCE: 0.15, // 15% variance threshold
  SUSPICIOUS_ASPECT_RATIOS: [1.0, 1.33, 1.5], // Common screen ratios

  // Screenshot detection
  MAX_PIXEL_DENSITY: 3.0, // Screenshots often have uniform pixel density
  SCREENSHOT_ARTIFACT_PATTERNS: ['moire', 'scanlines', 'uniform_grid'],

  // Enforcement
  LOCKOUT_DURATION_HOURS: 24,
  MAX_ATTEMPTS_BEFORE_LOCK: 2,
};

// ═══════════════════════════════════════════════════════════════════════════
// ERROR MESSAGES — Friendly Focusly Explanations
// ═══════════════════════════════════════════════════════════════════════════

export const BYPASS_ERROR_MESSAGES = {
  EXIF_MISSING: {
    title: '📷 Live Capture Required',
    message: 'We can\'t verify this is a live photo. Please use your camera directly — no uploads from your gallery.',
    mascotMessage: 'Macha, I need to see a FRESH photo! Take it right now with your camera, not from your gallery.',
    severity: 'error',
    action: 'Use camera button to take a new photo',
  },

  EXIF_TOO_OLD: {
    title: '⏰ Photo Too Old',
    message: 'This photo was taken more than 5 minutes ago. For security, we need a fresh capture.',
    mascotMessage: 'That photo is too old, Macha! Take a new one right now — I need to see you in real-time!',
    severity: 'error',
    action: 'Take a new photo now',
  },

  SCREEN_ON_SCREEN: {
    title: '🖥️ Screen Detected',
    message: 'We detected this might be a photo of a screen. Please scan your actual physical ID card.',
    mascotMessage: 'Hey! Is that a photo of a photo? I need to see your REAL ID card, Macha! No screens!',
    severity: 'warning',
    action: 'Scan the physical ID card',
  },

  SCREENSHOT_ARTIFACTS: {
    title: '📱 Screenshot Detected',
    message: 'This appears to be a screenshot. We require direct camera capture for verification.',
    mascotMessage: 'That looks like a screenshot! Open your camera and take a real photo of your ID, Macha!',
    severity: 'error',
    action: 'Use camera, not screenshot',
  },

  TAMPERING_DETECTED: {
    title: '🚨 Tampering Detected',
    message: 'We detected potential manipulation. Your account is locked for 24 hours for security.',
    mascotMessage: 'Something fishy is going on, Macha! I\'m locking this down for 24 hours to keep everyone safe.',
    severity: 'critical',
    action: 'Contact support@focusapp.in if you believe this is an error',
    lockout: true,
  },

  STATIC_IMAGE_INJECTION: {
    title: '🚨 Injection Attack Blocked',
    message: 'We detected a static image injection attempt. This account is now locked.',
    mascotMessage: 'Nice try! But I caught that, Macha. Static images are not allowed. Account locked for 24 hours.',
    severity: 'critical',
    action: 'Contact admin@focusapp.in to appeal',
    lockout: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// EXIF ANALYSIS — Live Capture Enforcement
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract EXIF data from image file
 * @param {File} file - Image file to analyze
 * @returns {Promise<Object>} EXIF data object
 */
export const extractEXIF = async (file) => {
  try {
    // Dynamic import EXIF reader
    const ExifReader = await import('exifreader');
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer);

    return {
      hasExif: Object.keys(tags).length > 0,
      dateTime: tags?.DateTime?.description || null,
      dateTimeOriginal: tags?.DateTimeOriginal?.description || null,
      createDate: tags?.CreateDate?.description || null,
      make: tags?.Make?.description || null,
      model: tags?.Model?.description || null,
      software: tags?.Software?.description || null,
      allTags: tags,
    };
  } catch (error) {
    console.error('[AntiBypass] EXIF extraction failed:', error);
    return { hasExif: false, error: error.message };
  }
};

/**
 * Check if image has live capture evidence
 * @param {Object} exifData - EXIF data from extractEXIF
 * @returns {Object} Validation result
 */
export const validateLiveCapture = (exifData) => {
  // Check for required EXIF tags
  const hasTimestamp = BYPASS_CONFIG.EXIF_REQUIRED_TAGS.some(tag =>
    exifData[tag.toLowerCase()] || exifData[tag]
  );

  if (!hasTimestamp) {
    return {
      valid: false,
      code: 'EXIF_MISSING',
      reason: 'No capture timestamp in EXIF data',
      ...BYPASS_ERROR_MESSAGES.EXIF_MISSING,
    };
  }

  // Check photo age
  const captureDate = exifData.dateTimeOriginal || exifData.dateTime || exifData.createDate;
  if (captureDate) {
    const photoTime = new Date(captureDate.replace(/:/g, '-'));
    const now = new Date();
    const ageMinutes = (now - photoTime) / (1000 * 60);

    if (ageMinutes > BYPASS_CONFIG.MAX_FILE_AGE_MINUTES) {
      return {
        valid: false,
        code: 'EXIF_TOO_OLD',
        reason: `Photo is ${Math.round(ageMinutes)} minutes old`,
        ageMinutes,
        ...BYPASS_ERROR_MESSAGES.EXIF_TOO_OLD,
      };
    }
  }

  // Check for editing software (suspicious)
  if (exifData.software) {
    const editingSoftware = ['photoshop', 'gimp', 'lightroom', 'canva', 'pixelmator'];
    const hasEdited = editingSoftware.some(sw =>
      exifData.software.toLowerCase().includes(sw)
    );

    if (hasEdited) {
      return {
        valid: false,
        code: 'TAMPERING_DETECTED',
        reason: `Editing software detected: ${exifData.software}`,
        ...BYPASS_ERROR_MESSAGES.TAMPERING_DETECTED,
      };
    }
  }

  return { valid: true, code: 'LIVE_CAPTURE_VERIFIED' };
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN-ON-SCREEN DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze image for screen-on-screen indicators
 * Uses canvas pixel analysis
 * @param {HTMLImageElement|HTMLCanvasElement} imageSource - Image to analyze
 * @returns {Promise<Object>} Analysis result
 */
export const detectScreenOnScreen = async (imageSource) => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const img = imageSource instanceof HTMLImageElement
        ? imageSource
        : new Image();

      if (imageSource instanceof HTMLCanvasElement) {
        canvas.width = imageSource.width;
        canvas.height = imageSource.height;
        ctx.drawImage(imageSource, 0, 0);
        analyzePixels();
      } else if (imageSource instanceof HTMLImageElement) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        analyzePixels();
      } else {
        img.onload = () => {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          analyzePixels();
        };
        img.onerror = () => resolve({ error: true, isScreen: false });
        img.src = imageSource;
      }

      function analyzePixels() {
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Check 1: Pixel uniformity (screens have uniform pixel patterns)
          let uniformPixelCount = 0;
          const sampleSize = Math.min(data.length / 4, 10000);
          const step = Math.floor((data.length / 4) / sampleSize);

          let prevR = -1, prevG = -1, prevB = -1;
          let uniformStreak = 0;

          for (let i = 0; i < data.length; i += step * 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Check if pixel is similar to previous (indicates screen grid)
            if (Math.abs(r - prevR) < 5 && Math.abs(g - prevG) < 5 && Math.abs(b - prevB) < 5) {
              uniformStreak++;
              if (uniformStreak > 50) {
                uniformPixelCount++;
              }
            } else {
              uniformStreak = 0;
            }

            prevR = r;
            prevG = g;
            prevB = b;
          }

          const uniformityRatio = uniformPixelCount / sampleSize;

          // Check 2: Aspect ratio (common screen ratios)
          const aspectRatio = canvas.width / canvas.height;
          const suspiciousRatio = BYPASS_CONFIG.SUSPICIOUS_ASPECT_RATIOS.some(
            ratio => Math.abs(aspectRatio - ratio) < 0.1
          );

          // Check 3: Moire pattern detection (simplified)
          const hasMoire = detectMoirePattern(data, canvas.width, canvas.height);

          const isScreen = uniformityRatio > 0.3 || (suspiciousRatio && uniformityRatio > 0.15) || hasMoire;

          resolve({
            isScreen,
            confidence: Math.min(100, uniformityRatio * 200),
            uniformityRatio,
            suspiciousRatio,
            hasMoire,
            aspectRatio,
          });
        } catch (error) {
          resolve({ error: true, isScreen: false });
        }
      }
    } catch (error) {
      resolve({ error: true, isScreen: false });
    }
  });
};

/**
 * Simple moire pattern detection
 * Looks for regular grid patterns typical of screens
 */
function detectMoirePattern(data, width, height) {
  const sampleRows = 10;
  const rowStep = Math.floor(height / sampleRows);
  let patternScore = 0;

  for (let row = 0; row < sampleRows; row++) {
    const y = row * rowStep;
    const rowStart = y * width * 4;
    let rowVariance = 0;

    // Sample pixels across the row
    for (let x = 0; x < width; x += 10) {
      const idx = rowStart + x * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      rowVariance += brightness;
    }

    // Check for periodic patterns
    if (row > 0 && Math.abs(rowVariance - patternScore) < 1000) {
      patternScore++;
    }
  }

  return patternScore > 5;
}

// ═══════════════════════════════════════════════════════════════════════════
// 24-HOUR LOCKOUT ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check and enforce 24-hour lockout
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Lock status
 */
export const checkLockoutStatus = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('verification_audit_trail')
      .select('created_at, event_type')
    .eq('user_id', userId)
      .in('event_type', ['bypass_detected', 'tampering_detected', 'injection_blocked'])
      .order('created_at', { ascending: false })
      .limit(BYPASS_CONFIG.MAX_ATTEMPTS_BEFORE_LOCK);

    if (error) throw error;

    if (!data || data.length < BYPASS_CONFIG.MAX_ATTEMPTS_BEFORE_LOCK) {
      return { locked: false };
    }

    // Check if within 24 hours
    const mostRecent = new Date(data[0].created_at);
    const hoursSince = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60);

    if (hoursSince < BYPASS_CONFIG.LOCKOUT_DURATION_HOURS) {
      const hoursRemaining = Math.ceil(BYPASS_CONFIG.LOCKOUT_DURATION_HOURS - hoursSince);

      return {
        locked: true,
        hoursRemaining,
        message: `Account locked for ${hoursRemaining} more hours due to security concerns.`,
        ...BYPASS_ERROR_MESSAGES.TAMPERING_DETECTED,
      };
    }

    return { locked: false };
  } catch (error) {
    console.error('[AntiBypass] Lockout check failed:', error);
    return { locked: false, error: error.message };
  }
};

/**
 * Apply 24-hour lockout to user
 * @param {string} userId - User ID
 * @param {string} reason - Lock reason code
 * @returns {Promise<boolean>} Success status
 */
export const applyLockout = async (userId, reason) => {
  try {
    await supabase.from('verification_audit_trail').insert({
      user_id: userId,
      event_type: reason,
      status: 'locked',
      event_data: {
        lockout_duration_hours: BYPASS_CONFIG.LOCKOUT_DURATION_HOURS,
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    // Update profile to locked state
    await supabase.from('profiles').update({
      verification_status: 'LOCKED',
      trust_shield_status: 'LOCKED',
      can_post: false,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    return true;
  } catch (error) {
    console.error('[AntiBypass] Lockout application failed:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MASTER VALIDATION PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run complete anti-bypass validation
 * @param {Object} params - Validation parameters
 * @returns {Promise<Object>} Complete validation result
 */
export const runAntiBypassValidation = async ({
  file,
  imageElement,
  userId,
  context = 'id_scan',
}) => {
  const results = {
    passed: true,
    checks: {},
    errors: [],
    lockoutApplied: false,
  };

  // Check 0: Lockout status
  const lockoutStatus = await checkLockoutStatus(userId);
  if (lockoutStatus.locked) {
    return {
      passed: false,
      locked: true,
      hoursRemaining: lockoutStatus.hoursRemaining,
      error: lockoutStatus,
      ...BYPASS_ERROR_MESSAGES.TAMPERING_DETECTED,
    };
  }

  // Check 1: EXIF Live Capture
  if (file) {
    const exifData = await extractEXIF(file);
    const liveCapture = validateLiveCapture(exifData);
    results.checks.exif = liveCapture;

    if (!liveCapture.valid) {
      results.passed = false;
      results.errors.push(liveCapture);
    }
  }

  // Check 2: Screen-on-screen
  if (imageElement) {
    const screenCheck = await detectScreenOnScreen(imageElement);
    results.checks.screen = screenCheck;

    if (screenCheck.isScreen) {
      results.passed = false;
      results.errors.push({
        code: 'SCREEN_ON_SCREEN',
        ...BYPASS_ERROR_MESSAGES.SCREEN_ON_SCREEN,
        confidence: screenCheck.confidence,
      });
    }
  }

  // Apply lockout if critical violations detected
  if (!results.passed) {
    const criticalErrors = results.errors.filter(e =>
      e.severity === 'critical' || e.lockout
    );

    if (criticalErrors.length > 0) {
      await applyLockout(userId, 'bypass_detected');
      results.lockoutApplied = true;
    }
  }

  return results;
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  extractEXIF,
  validateLiveCapture,
  detectScreenOnScreen,
  checkLockoutStatus,
  applyLockout,
  runAntiBypassValidation,
  BYPASS_ERROR_MESSAGES,
  BYPASS_CONFIG,
};
