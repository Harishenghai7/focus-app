/**
 * Validates a password against security requirements.
 * Requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one number
 * - Contains at least one special character
 * 
 * @param {string} password - The password to validate.
 * @returns {object} - An object containing 'isValid' (boolean) and 'errors' (array of strings).
 */
export const validatePassword = (password) => {
    const errors = [];

    if (!password || password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
