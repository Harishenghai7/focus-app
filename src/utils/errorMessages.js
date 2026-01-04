/**
 * User-Friendly Error Message Utilities
 * Converts technical errors to human-readable messages
 */

// Error message mappings
const ERROR_MAPPINGS = {
    // Network errors
    'Failed to fetch': 'Connection error. Please check your internet connection.',
    'NetworkError': 'Network error. Please check your connection and try again.',
    'net::ERR_': 'Network error. Please check your internet connection.',
    'timeout': 'Request timed out. Please try again.',
    'ECONNREFUSED': 'Cannot connect to server. Please try again later.',

    // Authentication errors
    '401': 'Session expired. Please log in again.',
    'Unauthorized': 'You need to log in to do this.',
    'Invalid login': 'Incorrect email or password.',
    'Invalid credentials': 'Incorrect email or password.',
    'JWT expired': 'Your session has expired. Please log in again.',
    'JWT': 'Session error. Please log in again.',

    // Permission errors
    '403': "You don't have permission to do this.",
    'Forbidden': "You don't have permission to do this.",
    'permission denied': "You don't have permission to do this.",

    // Not found errors
    '404': 'The requested content was not found.',
    'PGRST116': 'Content not found.',
    'Not Found': 'The page or content you requested was not found.',

    // Server errors
    '500': 'Something went wrong on our end. Please try again.',
    '502': 'Server temporarily unavailable. Please try again.',
    '503': 'Service temporarily unavailable. Please try again later.',
    'Internal Server Error': 'Something went wrong. Please try again.',

    // Database errors
    'PGRST': 'Database error. Please try again.',
    'duplicate key': 'This already exists. Please try a different value.',
    'violates foreign key': 'Cannot complete action - referenced item not found.',
    'violates unique constraint': 'This value is already taken.',
    'violates check constraint': 'Invalid value provided.',

    // Supabase specific
    'Email not confirmed': 'Please verify your email address first.',
    'User already registered': 'An account with this email already exists.',
    'Invalid email': 'Please enter a valid email address.',
    'Password should be': 'Password must be at least 6 characters.',
    'rate limit': 'Too many requests. Please wait a moment and try again.',

    // File upload errors
    'Payload too large': 'File is too large. Please choose a smaller file.',
    'file_too_large': 'File is too large. Maximum size is 10MB.',
    'invalid_file_type': 'Invalid file type. Please use images or videos only.',
    'bucket not found': 'Upload service unavailable. Please try again.',

    // Validation errors
    'required': 'Please fill in all required fields.',
    'invalid input': 'Please check your input and try again.',
};

/**
 * Convert technical error to user-friendly message
 * @param {Error|string} error - The error to convert
 * @returns {string} - User-friendly error message
 */
export const getFriendlyError = (error) => {
    // Handle null/undefined
    if (!error) return 'An unexpected error occurred. Please try again.';

    // Get error message string
    const errorMessage = typeof error === 'string'
        ? error
        : error.message || error.toString();

    // Check for matching error patterns
    for (const [pattern, friendlyMessage] of Object.entries(ERROR_MAPPINGS)) {
        if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
            return friendlyMessage;
        }
    }

    // If no match found, return generic message for production
    // or the original message for development
    if (process.env.NODE_ENV === 'development') {
        console.error('Unmapped error:', errorMessage);
        return errorMessage;
    }

    return 'Something went wrong. Please try again.';
};

/**
 * Log error for debugging while showing friendly message
 * @param {Error} error - The original error
 * @param {string} context - Where the error occurred
 */
export const logAndGetFriendlyError = (error, context = 'Unknown') => {
    console.error(`[${context}] Error:`, error);
    return getFriendlyError(error);
};

/**
 * Handle API response and throw user-friendly error if needed
 * @param {Response} response - Fetch response object
 * @throws {Error} - User-friendly error if response not ok
 */
export const handleApiResponse = async (response) => {
    if (!response.ok) {
        let errorMessage;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || response.statusText;
        } catch {
            errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(getFriendlyError(`${response.status}: ${errorMessage}`));
    }
    return response;
};

export default getFriendlyError;
