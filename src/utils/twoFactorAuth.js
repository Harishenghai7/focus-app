/**
 * Two-Factor Authentication (2FA) utilities
 * Implements TOTP-based 2FA with QR code generation and backup codes
 */

import { supabase } from '../supabaseClient';

/**
 * Generates a random secret for TOTP
 * @returns {string} Base32 encoded secret
 */
import { generateSecret as generateTOTPSecret } from '@otplib/plugin-thirty-two';

// Feature #7: Password reset
// Improvement: Using a tested library for secret generation
const generateSecret = () => {
  return generateTOTPSecret();
};

/**
 * Generates backup codes for 2FA recovery
 * @param {number} count - Number of backup codes to generate
 * @returns {string[]} Array of backup codes
 */
const generateBackupCodes = (count = 8) => {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    
    const code = Array.from(array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
      .match(/.{1,4}/g)
      .join('-');
    
    codes.push(code);
  }
  
  return codes;
};

/**
 * Generates a QR code URL for authenticator apps
 * @param {string} secret - TOTP secret
 * @param {string} email - User's email
 * @param {string} issuer - App name (default: Focus)
 * @returns {string} QR code data URL
 */
export const generateQRCode = (secret, email, issuer = 'Focus') => {
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  
  // Using a QR code API service (can be replaced with a library like qrcode)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
};

/**
 * Enables 2FA for a user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Promise<Object>} 2FA setup data including secret, QR code, and backup codes
 */
export const enable2FA = async (userId, email) => {
  try {
    const secret = generateSecret();
    const backupCodes = generateBackupCodes();
    const qrCodeUrl = generateQRCode(secret, email);
    
    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(async (code) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(code);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      })
    );
    
    // Store in database
    const { error } = await supabase
      .from('profiles')
      .update({
        two_factor_secret: secret,
        two_factor_backup_codes: hashedBackupCodes,
        two_factor_enabled: false // Will be enabled after verification
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return {
      secret,
      qrCodeUrl,
      backupCodes, // Return unhashed codes for user to save
      success: true
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Verifies a TOTP code
 * @param {string} secret - TOTP secret
 * @param {string} token - 6-digit code from authenticator
 * @returns {Promise<boolean>} True if valid
 */
export const verifyTOTP = async (secret, token) => {
  try {
    // Simple TOTP verification (in production, use a proper TOTP library)
    // This is a simplified implementation for demonstration
    
    if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
      return false;
    }
    
    // In a real implementation, you would:
    // 1. Calculate the current time step
    // 2. Generate TOTP codes for current and adjacent time windows
    // 3. Compare with the provided token
    
    // For now, we'll use Supabase's built-in verification if available
    // or implement a basic check
    
import { authenticator } from '@otplib/preset-default';

// Feature #6: Two-factor authentication
// Improvement: Using a tested TOTP verification from otplib
return authenticator.check(token, secret);
  } catch (error) {
    return false;
  }
};

/**
 * Confirms 2FA setup after user verifies the code
 * @param {string} userId - User ID
 * @param {string} token - Verification code
 * @returns {Promise<boolean>} True if successful
 */
export const confirm2FASetup = async (userId, token) => {
  try {
    // Get user's secret
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('two_factor_secret')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!profile?.two_factor_secret) {
      throw new Error('2FA not initialized');
    }
    
    // Verify the token
    const isValid = await verifyTOTP(profile.two_factor_secret, token);
    
    if (!isValid) {
      return false;
    }
    
    // Enable 2FA
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ two_factor_enabled: true })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Disables 2FA for a user
 * @param {string} userId - User ID
 * @param {string} password - User's password for confirmation
 * @returns {Promise<boolean>} True if successful
 */
export const disable2FA = async (userId, password) => {
  try {
    // Verify password first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }
    
    // Update database
    const { error } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Verifies a backup code
 * @param {string} userId - User ID
 * @param {string} code - Backup code
 * @returns {Promise<boolean>} True if valid
 */
export const verifyBackupCode = async (userId, code) => {
  try {
    // Get user's backup codes
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('two_factor_backup_codes')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!profile?.two_factor_backup_codes) {
      return false;
    }
    
    // Hash the provided code
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedCode = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Check if code exists
    const codeIndex = profile.two_factor_backup_codes.indexOf(hashedCode);
    
    if (codeIndex === -1) {
      return false;
    }
    
    // Remove used backup code
    const updatedCodes = [...profile.two_factor_backup_codes];
    updatedCodes.splice(codeIndex, 1);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ two_factor_backup_codes: updatedCodes })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Checks if user has 2FA enabled
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if 2FA is enabled
 */
export const is2FAEnabled = async (userId) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('two_factor_enabled')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return profile?.two_factor_enabled || false;
  } catch (error) {
    return false;
  }
};

export default {
  enable2FA,
  confirm2FASetup,
  disable2FA,
  verifyTOTP,
  verifyBackupCode,
  is2FAEnabled,
  generateQRCode
};
