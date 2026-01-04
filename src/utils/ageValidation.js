/**
 * Age Validation Utilities
 * Calculate age from date of birth and validate age requirements
 */

/**
 * Calculate age from date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number} Age in years
 */
export const calculateAge = (dob) => {
    if (!dob) return null;

    const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

/**
 * Check if age meets minimum requirement
 * @param {number} age - Age to validate
 * @param {number} minAge - Minimum age required (default: 13)
 * @returns {boolean} True if age is valid
 */
export const isAgeValid = (age, minAge = 13) => {
    if (age === null || age === undefined) return false;
    return age >= minAge;
};

/**
 * Check if user is a teen (13-17 years old)
 * @param {number} age - Age to check
 * @returns {boolean} True if user is a teen
 */
export const isTeen = (age) => {
    if (age === null || age === undefined) return false;
    return age >= 13 && age < 18;
};

/**
 * Format date of birth from separate month, day, year values
 * @param {number|string} month - Month (1-12)
 * @param {number|string} day - Day (1-31)
 * @param {number|string} year - Year (e.g., 2002)
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDOB = (month, day, year) => {
    if (!month || !day || !year) return null;

    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');

    return `${year}-${m}-${d}`;
};

/**
 * Validate date of birth
 * @param {number|string} month - Month (1-12)
 * @param {number|string} day - Day (1-31)
 * @param {number|string} year - Year
 * @returns {Object} Validation result with isValid and error message
 */
export const validateDOB = (month, day, year) => {
    if (!month || !day || !year) {
        return { isValid: false, error: 'Please select your complete date of birth' };
    }

    const dob = new Date(year, month - 1, day);
    const today = new Date();

    // Check if date is valid
    if (dob.getMonth() !== month - 1 || dob.getDate() !== parseInt(day)) {
        return { isValid: false, error: 'Invalid date' };
    }

    // Check if date is in the future
    if (dob > today) {
        return { isValid: false, error: 'Date of birth cannot be in the future' };
    }

    // Check if user is too old (e.g., over 120 years)
    const age = calculateAge(dob);
    if (age > 120) {
        return { isValid: false, error: 'Please enter a valid date of birth' };
    }

    return { isValid: true, error: null };
};

/**
 * Get content filter level based on age
 * @param {number} age - User's age
 * @returns {string} Filter level: 'strict', 'moderate', or 'off'
 */
export const getContentFilterLevel = (age) => {
    if (age === null || age === undefined) return 'moderate';
    if (age < 13) return 'strict'; // Shouldn't happen, but just in case
    if (age < 18) return 'strict'; // Teen mode
    return 'moderate'; // Adult mode
};

/**
 * Get age validation message
 * @param {number} age - User's age
 * @returns {Object} Message object with type and text
 */
export const getAgeValidationMessage = (age) => {
    if (age === null || age === undefined) {
        return null;
    }

    if (age < 13) {
        return {
            type: 'error',
            text: 'You must be at least 13 years old to use Focus'
        };
    }

    if (age < 18) {
        return {
            type: 'info',
            text: 'Teen Care mode will be enabled for your account'
        };
    }

    return null;
};
