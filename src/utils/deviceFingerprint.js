import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Device Fingerprinting Utility
 * 
 * Generates a unique device identifier based on browser and system attributes.
 * Privacy-compliant: Hashes data, does not store raw PII.
 */

// Initialize FingerprintJS agent
const fpPromise = FingerprintJS.load();

export const getDeviceFingerprint = async () => {
    try {
        const fp = await fpPromise;
        const result = await fp.get();
        return {
            visitorId: result.visitorId,
            components: result.components
        };
    } catch (error) {
        console.error('Error generating fingerprint:', error);
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
    const basicFingerprint = await getDeviceFingerprint();

    if (!basicFingerprint) return null;

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
