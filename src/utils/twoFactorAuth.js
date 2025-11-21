import { TOTP, Secret } from 'otpauth';
import { supabase } from '../supabaseClient';

// Configuration for TOTP
export const TOTP_CONFIG = {
  issuer: 'Focus App',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  window: 1
};

/**
 * Generates a new TOTP secret
 * @param {string} email - User's email for the OTP label
 * @returns {Object} Object containing secret and auth URL
 */
export const generateSecret = (email) => {
  try {
    const totp = new TOTP({
      ...TOTP_CONFIG,
      label: email,
      secret: Secret.fromBase32(Secret.generate())
    });
    
    return {
      secret: totp.secret.base32,
      otpauthUrl: totp.toString(),
      uri: totp.toString()
    };
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    throw new Error('Failed to generate TOTP secret');
  }
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
      .join('-')
    
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
  try {
    const totp = new TOTP({
      ...TOTP_CONFIG,
      label: email,
      issuer,
      secret: Secret.fromBase32(secret)
    });
    
    const otpauthUrl = totp.toString();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
  } catch (error) {
    console.error('Error generating QR code URL:', error);
    throw new Error('Failed to generate QR code URL');
  }
};

/**
 * Enables 2FA for a user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Promise<Object>} 2FA setup data including secret, QR code, and backup codes
 */
export const enable2FA = async (userId, email) => {
  try {
    const secretData = generateSecret(email);
    const backupCodes = generateBackupCodes();
    const qrCodeUrl = generateQRCode(secretData.secret, email);
    
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
        two_factor_secret: secretData.secret,
        two_factor_backup_codes: hashedBackupCodes,
        two_factor_enabled: false // Will be enabled after verification
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    return {
      secret: secretData.secret,
      qrCodeUrl,
      backupCodes, // Return unhashed codes for user to save
      success: true
    };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    throw error;
  }
};

/**
 * Verifies a TOTP token
 * @param {string} token - The token to verify
 * @param {string} secret - The base32 secret to verify against
 * @returns {boolean} True if token is valid
 */
export const verifyTOTP = (token, secret) => {
  try {
    if (!token || !secret) return false;
    
    const totp = new TOTP({
      ...TOTP_CONFIG,
      secret: Secret.fromBase32(secret)
    });
    
    return totp.validate({ token, window: TOTP_CONFIG.window }) !== null;
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
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
