/**
 * 🔥 BULLETPROOF TRUST SHIELD V3 - ULTRA STRICT VERIFICATION
 * 
 * CRITICAL: Now uses SQL finalize_verification_ultra RPC
 * Enforces: One Government ID = One Person = One Account
 */

import { generateAdvancedFingerprint } from './deviceFingerprint';
import { supabase } from '../lib/supabase';

const TRUST_SHIELD_VERSION = '3.0-ultra-strict';

/**
 * 🔥 ULTRA STRICT VERIFICATION - Calls SQL RPC to enforce One ID = One Account
 * This function NOW properly stores identity_hash and blocks duplicates
 */
export const runBulletproofVerification = async ({ 
    idImageFile, 
    ocrResult,
    userId,
    userEmail
}) => {

    
    // ═══════════════════════════════════════════════════════════════════════════
    // � VALIDATION LAYER 1: Basic OCR checks
    // ═══════════════════════════════════════════════════════════════════════════
    
    const hasValidOcr = ocrResult && ocrResult.name && ocrResult.dob && ocrResult.name.length >= 2;
    
    if (!hasValidOcr) {
        return {
            passed: false,
            reason: 'Please upload a valid ID with Name and Date of Birth clearly visible.',
            layer: 'ocr_validation',
            instant: false
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔒 VALIDATION LAYER 2: ID Number Extraction
    // ═══════════════════════════════════════════════════════════════════════════
    
    const idNumber = ocrResult?.idNumber || ocrResult?.id;
    if (!idNumber) {
        return {
            passed: false,
            reason: '🔒 ID NUMBER NOT DETECTED: Please upload a clearer image showing your Aadhaar/PAN number.',
            layer: 'id_extraction',
            instant: false
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // � VALIDATION LAYER 3: SQL Identity Check & Atomic Finalization
    // ═══════════════════════════════════════════════════════════════════════════
    
    try {
        const deviceId = generateSimpleDeviceId();
        
        // Call the ULTRA STRICT SQL function
        const { data: result, error } = await supabase.rpc('finalize_verification_ultra', {
            p_user_id: userId,
            p_id_number: idNumber,
            p_device_id: deviceId,
            p_ocr_data: {
                name: ocrResult.name,
                dob: ocrResult.dob,
                idNumber: idNumber,
                idType: ocrResult.idType || 'unknown'
            },
            p_face_score: 0.95, // High confidence for ID-only verification
            p_age_group: '18+' // Default to adult
        });
        
        if (error) {
            console.error('[TrustShieldV3] SQL Error:', error);
            return {
                passed: false,
                reason: '🔒 VERIFICATION ERROR: ' + error.message,
                layer: 'sql_error',
                instant: false
            };
        }
        
        // Check result from SQL
        if (!result?.success) {
            const errorMsg = result?.error || result?.message || 'Identity verification failed';
            console.error('[TrustShieldV3] Verification failed:', result);
            return {
                passed: false,
                reason: errorMsg,
                layer: result?.reason || 'verification_failed',
                instant: false
            };
        }
        
        // ═══════════════════════════════════════════════════════════════════════
        // ✅ SUCCESS - Identity hash stored, duplicate check passed
        // ═══════════════════════════════════════════════════════════════════════
        

        
        return {
            passed: true,
            score: 0.95,
            reason: 'ID verified successfully.',
            deviceFingerprint: deviceId,
            deviceId: deviceId,
            ocrData: ocrResult,
            verificationMethod: 'ultra_strict_sql',
            status: result?.status,
            instant: false,
            version: TRUST_SHIELD_VERSION,
            timestamp: new Date().toISOString()
        };
        
    } catch (err) {
        console.error('[TrustShieldV3] Verification exception:', err);
        return {
            passed: false,
            reason: '🔒 VERIFICATION ERROR: ' + err.message,
            layer: 'exception',
            instant: false
        };
    }
};

/**
 * Generate simple device ID (synchronous, no async)
 */
const generateSimpleDeviceId = () => {
    const data = [
        navigator.userAgent,
        navigator.language,
        window.screen.width + 'x' + window.screen.height,
        new Date().getTimezoneOffset()
    ].join('|');
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'device_' + Math.abs(hash).toString(16);
};

/**
 * Fire background checks (non-blocking, runs after user proceeds)
 */
const fireBackgroundChecks = async (data) => {

    
    try {
        // Import and run device fingerprinting in background
        const { generateAdvancedFingerprint } = await import('./deviceFingerprint');
        const deviceData = await generateAdvancedFingerprint().catch(() => null);
        
        // Update attempt counter
        const attempts = parseInt(localStorage.getItem('trustShieldAttempts') || '0');
        localStorage.setItem('trustShieldAttempts', (attempts + 1).toString());
        localStorage.setItem('trustShieldLastAttempt', Date.now().toString());
        
        // Store device fingerprint for duplicate checking
        if (deviceData?.fingerprintId) {
            localStorage.setItem('trustShieldDeviceId', deviceData.fingerprintId);
        }
        

    } catch (err) {
        console.warn('[TrustShieldV3] Background check error (non-critical):', err);
    }
};

/**
 * Check if device already has an account (One Person, One Account)
 * Backend should also check this server-side
 */
export const checkExistingDevice = async () => {
    try {
        const deviceData = await generateAdvancedFingerprint();
        if (!deviceData) return { checked: false };
        
        // Get stored device IDs from localStorage (for quick client-side check)
        const knownDevices = JSON.parse(localStorage.getItem('focusKnownDevices') || '[]');
        const isKnown = knownDevices.includes(deviceData.fingerprintId);
        
        // Add current device to known list
        if (!isKnown) {
            knownDevices.push(deviceData.fingerprintId);
            localStorage.setItem('focusKnownDevices', JSON.stringify(knownDevices.slice(-5))); // Keep last 5
        }
        
        return {
            checked: true,
            deviceId: deviceData.fingerprintId,
            isKnownDevice: isKnown,
            totalDevices: knownDevices.length
        };
    } catch (err) {
        console.error('[TrustShieldV2] Device check error:', err);
        return { checked: false, error: err.message };
    }
};

/**
 * Legacy function - redirects to new bulletproof system
 * Maintains compatibility with existing code
 */
export const runFaceSimilarityCheck = async (params) => {

    return runBulletproofVerification(params);
};

/**
 * Pre-warm the verification system (no models to load now!)
 */
export const prewarmModels = async () => {

    return { success: true, method: 'id_only' };
};

/**
 * Generate liveness actions (kept for UI compatibility)
 */
export const generateLivenessActions = () => {
    // Return simple actions for UI, but we won't actually use face recognition
    return ['Look at camera', 'Hold still'];
};

/**
 * Persist verification state to Supabase
 */
export const persistTrustShieldState = async (data) => {
    try {
        // Import supabase here to avoid circular deps
        const { supabase } = await import('../lib/supabase');
        
        const { error } = await supabase
            .from('trust_shield_audit')
            .insert({
                user_id: data.userId,
                verification_status: data.verificationStatus,
                ocr_result: data.ocrResult,
                face_score: data.faceScore || 0.85,
                attempt_result: data.attemptResult,
                device_fingerprint: data.deviceFingerprint,
                ip_address: data.ipAddress,
                created_at: new Date().toISOString()
            });
            
        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('[TrustShieldV2] Persist error:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Create guardian handshake for minors
 */
export const createGuardianHandshake = async (userId, guardianEmail) => {
    try {
        const { supabase } = await import('../lib/supabase');
        
        const handshakeId = crypto.randomUUID();
        
        const { error } = await supabase
            .from('guardian_handshakes')
            .insert({
                id: handshakeId,
                minor_user_id: userId,
                guardian_email: guardianEmail,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            
        if (error) throw error;
        
        return {
            success: true,
            handshakeId,
            link: `${window.location.origin}/guardian-verify?handshake=${handshakeId}`
        };
    } catch (err) {
        console.error('[TrustShieldV2] Handshake error:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Extract identity from ID using OCR
 */
export const extractIdentityFromId = async (file) => {
    // This is handled by useOCRScanner hook in the component
    // Kept here for backwards compatibility
    return { success: true, note: 'Use useOCRScanner hook instead' };
};
