import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Device Fingerprinting Utility
 * 
 * Generates a unique device identifier based on browser and system attributes.
 * Privacy-compliant: Hashes data, does not store raw PII.
 */

// Timeout wrapper for promises
const withTimeout = (promise, ms, label) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        )
    ]);
};

// Initialize FingerprintJS agent with timeout
let fpPromise = null;
let fpLoaded = false;

const loadFingerprintJS = async () => {
    if (fpLoaded && fpPromise) return fpPromise;
    
    try {
        fpPromise = await withTimeout(
            FingerprintJS.load(),
            5000, // 5 second timeout
            'FingerprintJS load'
        );
        fpLoaded = true;
        return fpPromise;
    } catch (err) {
        console.warn('[Fingerprint] Failed to load:', err.message);
        fpPromise = null;
        fpLoaded = false;
        return null;
    }
};

export const getDeviceFingerprint = async () => {
    try {
        const fp = await loadFingerprintJS();
        if (!fp) return null;
        
        const result = await withTimeout(
            fp.get(),
            3000, // 3 second timeout for get
            'FingerprintJS get'
        );
        
        return {
            visitorId: result.visitorId,
            components: result.components
        };
    } catch (error) {
        console.error('[Fingerprint] Error:', error.message);
        return null;
    }
};

/**
 * Generates a comprehensive device hash including additional custom checks
 * (Canvas, WebGL, Audio) if needed beyond FingerprintJS.
 * 
 * Note: FingerprintJS handles most of this, but we can add custom layers.
 */
export const generateAdvancedFingerprint = async () => {
    // Try to get fingerprint with timeout
    let basicFingerprint = null;
    try {
        basicFingerprint = await withTimeout(
            getDeviceFingerprint(),
            8000, // 8 second total timeout
            'Device fingerprinting'
        );
    } catch (err) {
        console.warn('[Fingerprint] Timed out, using fallback:', err.message);
    }

    // If fingerprinting fails, generate a simple fallback ID
    if (!basicFingerprint) {
        console.log('[Fingerprint] Using fallback device ID');
        const fallbackData = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform: navigator.platform,
            random: Math.random().toString(36).substring(2), // Random component
            timestamp: Date.now()
        };
        
        const fallbackHash = await hashData(JSON.stringify(fallbackData));
        
        return {
            fingerprintId: fallbackHash,
            details: fallbackData,
            visitorId: `fallback_${fallbackHash.substring(0, 16)}`,
            isFallback: true
        };
    }

    const data = {
        visitorId: basicFingerprint.visitorId,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        // Add custom canvas/webgl checks here if needed for stricter security
    };

    // Simple hash of the combined data (mock implementation of hashData)
    const hash = await hashData(JSON.stringify(data));

    return {
        fingerprintId: hash,
        details: data,
        visitorId: basicFingerprint.visitorId // Keep the stable ID from library
    };
};

// Helper to hash data (SHA-256)
const hashData = async (string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const isSuspiciousDevice = (deviceData) => {
    // Logic to detect suspicious patterns
    // e.g., Mismatched timezone and IP (requires IP geo lookup backend)
    // e.g., Headless browser detection
    const isHeadless = /HeadlessChrome/.test(navigator.userAgent);
    if (isHeadless) return true;

    // Screen resolution check (bots often have 0x0 or standard small sizes)
    if (window.screen.width === 0 || window.screen.height === 0) return true;

    return false;
};
