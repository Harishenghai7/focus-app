/**
 * trustShieldDuplicateCheck.js
 * ==============================
 * Early duplicate detection for Trust Shield verification.
 * Checks if Aadhaar/Student ID already exists BEFORE user starts scanning.
 * 
 * This prevents users from going through the entire process only to find
 * out their ID is already registered at the final step.
 */

import { supabase } from '../lib/supabase';

/**
 * Check if an Aadhaar or Government ID already exists in the system.
 * Called at Step 1 when user selects age tier.
 * 
 * @param {string} idNumber - The ID number to check (Aadhaar, PAN, etc.)
 * @param {string} idType - Type of ID: 'aadhaar', 'pan', 'passport', 'voter', 'dl'
 * @returns {Promise<{exists: boolean, error?: string, redirectTo?: string, alertType?: string}>}
 */
export const checkDuplicateID = async (idNumber, idType = 'aadhaar') => {
  if (!idNumber || idNumber.length < 4) {
    return { exists: false, error: 'Invalid ID number' };
  }

  try {
    const { data, error } = await supabase.rpc('check_id_duplicate', {
      p_id_number: idNumber,
      p_id_type: idType
    });

    if (error) {
      console.error('[TrustShield] Duplicate check failed:', error);
      // Fail open - let them proceed if check fails
      return { exists: false, error: error.message };
    }

    if (data?.exists) {
      return {
        exists: true,
        error: data.message || 'This ID is already registered',
        redirectTo: data.redirect_to || '/auth',
        alertType: data.alert_type || 'ID_ALREADY_REGISTERED',
        existingUser: {
          id: data.existing_user_id,
          name: data.existing_user_name,
          createdAt: data.created_at
        }
      };
    }

    return { exists: false, message: 'ID is available' };
  } catch (err) {
    console.error('[TrustShield] Duplicate check error:', err);
    // Fail open
    return { exists: false, error: err.message };
  }
};

/**
 * Check if a Student ID (School/College) already exists.
 * For 13-17 tier verification.
 * 
 * @param {string} studentId - The student ID number
 * @param {string} institutionName - Name of school/college
 * @returns {Promise<{exists: boolean, error?: string, redirectTo?: string, alertType?: string}>}
 */
export const checkDuplicateStudentID = async (studentId, institutionName) => {
  if (!studentId || studentId.length < 3) {
    return { exists: false, error: 'Invalid Student ID' };
  }

  try {
    const { data, error } = await supabase.rpc('check_student_id_duplicate', {
      p_student_id: studentId,
      p_institution_name: institutionName || ''
    });

    if (error) {
      console.error('[TrustShield] Student ID duplicate check failed:', error);
      return { exists: false, error: error.message };
    }

    if (data?.exists) {
      return {
        exists: true,
        error: data.message || 'This Student ID is already registered',
        redirectTo: data.redirect_to || '/auth',
        alertType: data.alert_type || 'STUDENT_ID_ALREADY_REGISTERED',
        institution: data.institution
      };
    }

    return { exists: false, message: 'Student ID is available' };
  } catch (err) {
    console.error('[TrustShield] Student ID check error:', err);
    return { exists: false, error: err.message };
  }
};

/**
 * Store ID number after successful OCR scan.
 * This is called after verification to save the ID for future duplicate checks.
 * 
 * @param {string} userId - Current user ID
 * @param {string} idNumber - The ID number (will be masked before storage)
 * @param {string} idType - Type of ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const storeIDNumber = async (userId, idNumber, idType) => {
  if (!userId || !idNumber) {
    return { success: false, error: 'Missing user ID or ID number' };
  }

  try {
    const { data, error } = await supabase.rpc('store_id_number', {
      p_user_id: userId,
      p_id_number: idNumber,
      p_id_type: idType
    });

    if (error) {
      console.error('[TrustShield] Store ID failed:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { 
        success: false, 
        error: data?.error || 'Failed to store ID',
        code: data?.code
      };
    }

    return { success: true, message: data.message };
  } catch (err) {
    console.error('[TrustShield] Store ID error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Store Student ID after successful scan.
 * 
 * @param {string} userId - Current user ID
 * @param {string} studentId - The student ID number
 * @param {string} institutionName - School/College name
 * @param {string} idType - 'school' or 'college'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const storeStudentID = async (userId, studentId, institutionName, idType = 'student') => {
  if (!userId || !studentId) {
    return { success: false, error: 'Missing user ID or Student ID' };
  }

  try {
    const { data, error } = await supabase.rpc('store_student_id', {
      p_user_id: userId,
      p_student_id: studentId,
      p_institution_name: institutionName || '',
      p_id_type: idType
    });

    if (error) {
      console.error('[TrustShield] Store Student ID failed:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { 
        success: false, 
        error: data?.error || 'Failed to store Student ID',
        code: data?.code
      };
    }
    
    return { success: true, message: data.message };
  } catch (err) {
    console.error('[TrustShield] Store Student ID error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Complete verification with ID storage (V2 of finalize_verification).
 * This replaces the old finalize_verification RPC call.
 * 
 * @param {Object} params - Verification parameters
 * @returns {Promise<{success: boolean, error?: string, code?: string}>}
 */
export const finalizeVerificationV2 = async ({
  userId,
  identityHash,
  deviceId,
  ocrData,
  faceScore,
  ageGroup
}) => {
  if (!userId || !identityHash) {
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    const { data, error } = await supabase.rpc('finalize_verification_v2', {
      p_user_id: userId,
      p_identity_hash: identityHash,
      p_device_id: deviceId,
      p_ocr_data: ocrData,
      p_face_score: faceScore,
      p_age_group: ageGroup
    });

    if (error) {
      console.error('[TrustShield] Finalize verification failed:', error);
      return { success: false, error: error.message, code: 'ERR_RPC_FAILED' };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || 'Verification failed',
        code: data?.code || 'ERR_VERIFICATION_FAILED'
      };
    }

    return {
      success: true,
      verificationStatus: data.verification_status,
      isMinor: data.is_minor,
      idType: data.id_type
    };
  } catch (err) {
    console.error('[TrustShield] Finalize error:', err);
    return { success: false, error: err.message, code: 'ERR_EXCEPTION' };
  }
};

/**
 * Alert configurations for duplicate ID detection.
 * Use these to show appropriate alerts to users.
 */
export const DUPLICATE_ALERTS = {
  ID_ALREADY_REGISTERED: {
    title: 'ID Already Registered',
    message: 'This ID is already registered to another Focus account. One ID can only be used for one account.',
    action: 'Please login to your existing account or contact support if you believe this is an error.',
    severity: 'error',
    redirectTo: '/auth'
  },
  STUDENT_ID_ALREADY_REGISTERED: {
    title: 'Student ID Already Registered',
    message: 'This Student ID is already registered. Each student can only have one Focus account.',
    action: 'Please login to your existing account or contact support.',
    severity: 'error',
    redirectTo: '/auth'
  },
  ID_REQUIRED: {
    title: 'ID Number Required',
    message: 'We could not detect an ID number from your document. Please upload a clearer image.',
    action: 'Make sure your ID is well-lit and all text is clearly visible.',
    severity: 'warning',
    redirectTo: null // Stay on current page
  }
};

/**
 * Get alert configuration by type.
 * @param {string} alertType - The alert type from check results
 * @returns {Object} Alert configuration
 */
export const getAlertConfig = (alertType) => {
  return DUPLICATE_ALERTS[alertType] || DUPLICATE_ALERTS.ID_REQUIRED;
};

export default {
  checkDuplicateID,
  checkDuplicateStudentID,
  storeIDNumber,
  storeStudentID,
  finalizeVerificationV2,
  getAlertConfig
};
