// Report validation utilities
import { getCategoriesByType, getSeverityLevel } from './reportCategories';

/**
 * Validate report submission data
 * @param {Object} reportData - Report data to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateReport = (reportData) => {
    const errors = [];

    // Check required fields
    if (!reportData.reporter_id) {
        errors.push('Reporter ID is required');
    }

    if (!reportData.content_type) {
        errors.push('Content type is required');
    }

    if (!reportData.category) {
        errors.push('Report category is required');
    }

    // Validate content type
    const validContentTypes = ['post', 'boltz', 'flash', 'comment', 'message', 'profile', 'user'];
    if (reportData.content_type && !validContentTypes.includes(reportData.content_type)) {
        errors.push(`Invalid content type: ${reportData.content_type}`);
    }

    // Validate category exists for content type
    if (reportData.category && reportData.content_type) {
        const categories = getCategoriesByType(reportData.content_type);
        const categoryExists = categories.some(cat => cat.id === reportData.category);

        if (!categoryExists) {
            errors.push(`Invalid category "${reportData.category}" for content type "${reportData.content_type}"`);
        }
    }

    // Validate reported entity is provided
    if (!reportData.reported_user_id && !reportData.reported_content_id) {
        errors.push('Must provide either reported_user_id or reported_content_id');
    }

    // Validate description length
    if (reportData.description && reportData.description.length > 1000) {
        errors.push('Description must be less than 1000 characters');
    }

    // Validate evidence URLs
    if (reportData.evidence_urls) {
        if (!Array.isArray(reportData.evidence_urls)) {
            errors.push('Evidence URLs must be an array');
        } else if (reportData.evidence_urls.length > 5) {
            errors.push('Maximum 5 evidence attachments allowed');
        } else {
            // Validate URL format
            reportData.evidence_urls.forEach((url, index) => {
                try {
                    new URL(url);
                } catch (e) {
                    errors.push(`Invalid URL at evidence index ${index}: ${url}`);
                }
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Validate support ticket submission
 * @param {Object} ticketData - Ticket data to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateTicket = (ticketData) => {
    const errors = [];

    // Required fields
    if (!ticketData.user_id) {
        errors.push('User ID is required');
    }

    if (!ticketData.category) {
        errors.push('Category is required');
    }

    if (!ticketData.subject || ticketData.subject.trim().length === 0) {
        errors.push('Subject is required');
    }

    if (!ticketData.description || ticketData.description.trim().length === 0) {
        errors.push('Description is required');
    }

    // Length validations
    if (ticketData.subject && ticketData.subject.length > 200) {
        errors.push('Subject must be less than 200 characters');
    }

    if (ticketData.description && ticketData.description.length > 5000) {
        errors.push('Description must be less than 5000 characters');
    }

    // Validate category
    const validCategories = ['account', 'bug', 'feature_request', 'privacy', 'billing', 'general'];
    if (ticketData.category && !validCategories.includes(ticketData.category)) {
        errors.push(`Invalid category: ${ticketData.category}`);
    }

    // Validate attachments
    if (ticketData.attachments) {
        if (!Array.isArray(ticketData.attachments)) {
            errors.push('Attachments must be an array');
        } else if (ticketData.attachments.length > 5) {
            errors.push('Maximum 5 attachments allowed');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Sanitize report data before submission
 * @param {Object} reportData - Raw report data
 * @returns {Object} - Sanitized report data
 */
export const sanitizeReportData = (reportData) => {
    return {
        reporter_id: reportData.reporter_id,
        reported_user_id: reportData.reported_user_id || null,
        reported_content_id: reportData.reported_content_id || null,
        content_type: reportData.content_type,
        category: reportData.category,
        description: reportData.description?.trim() || '',
        evidence_urls: reportData.evidence_urls || [],
        status: 'pending',
        priority: reportData.priority || 'medium'
    };
};

/**
 * Sanitize ticket data before submission
 * @param {Object} ticketData - Raw ticket data
 * @returns {Object} - Sanitized ticket data
 */
export const sanitizeTicketData = (ticketData) => {
    return {
        user_id: ticketData.user_id,
        category: ticketData.category,
        subject: ticketData.subject.trim(),
        description: ticketData.description.trim(),
        attachments: ticketData.attachments || [],
        status: 'open',
        priority: ticketData.priority || 'medium'
    };
};

export default {
    validateReport,
    validateTicket,
    sanitizeReportData,
    sanitizeTicketData
};
