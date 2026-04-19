// Supabase database operations for reports
import { supabase } from '../lib/supabase';
import { calculatePriority, getExistingReportCount, getUserTrustScore } from './reportPriority';
import { autoModerateContent } from './contentScanner';

/**
 * Submit a new report
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} - Created report
 */
export const submitReport = async (reportData) => {
    try {
        // Get context for priority calculation
        const context = {};

        // Get existing report count for this content
        if (reportData.reported_content_id) {
            context.existing_report_count = await getExistingReportCount(
                reportData.reported_content_id,
                reportData.content_type,
                supabase
            );
        }

        // Get trust scores
        context.reporter_trust_score = await getUserTrustScore(reportData.reporter_id, supabase);
        if (reportData.reported_user_id) {
            context.reported_user_trust_score = await getUserTrustScore(reportData.reported_user_id, supabase);
        }

        // Calculate priority
        const priority = await calculatePriority(reportData, context);

        // Insert report
        const { data, error } = await supabase
            .from('reports')
            .insert([{
                ...reportData,
                priority
            }])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error submitting report:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get reports by user (reporter)
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options { status, category, limit, offset }
 * @returns {Promise<Array>} - List of reports
 */
export const getReportsByUser = async (userId, filters = {}) => {
    try {
        let query = supabase
            .from('reports')
            .select(`
        *,
        reporter:reporter_id(id, username, avatar_url),
        reported_user:reported_user_id(id, username, avatar_url)
      `)
            .eq('reporter_id', userId)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        if (filters.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching user reports:', error);
        return { success: false, error: error.message, data: [] };
    }
};

/**
 * Get admin report queue
 * @param {Object} filters - Filter options { status, priority, category, dateFrom, dateTo, limit, offset }
 * @returns {Promise<Array>} - List of reports
 */
export const getReportQueue = async (filters = {}) => {
    try {
        let query = supabase
            .from('reports')
            .select(`
        *,
        reporter:reporter_id(id, username, avatar_url, trust_score),
        reported_user:reported_user_id(id, username, avatar_url, trust_score),
        admin:admin_id(id, username)
      `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.priority) {
            query = query.eq('priority', filters.priority);
        }

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }

        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        if (filters.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching report queue:', error);
        return { success: false, error: error.message, data: [] };
    }
};

/**
 * Update report status and take admin action
 * @param {string} reportId - Report ID
 * @param {Object} updateData - { status, admin_action, admin_notes, admin_id }
 * @returns {Promise<Object>} - Updated report
 */
export const updateReportStatus = async (reportId, updateData) => {
    try {
        const updates = {
            ...updateData,
            updated_at: new Date().toISOString()
        };

        if (updateData.status === 'resolved' || updateData.status === 'dismissed') {
            updates.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('reports')
            .update(updates)
            .eq('id', reportId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error updating report status:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get report statistics
 * @param {Object} dateRange - { from, to }
 * @returns {Promise<Object>} - Statistics
 */
export const getReportStatistics = async (dateRange = {}) => {
    try {
        let query = supabase
            .from('report_statistics')
            .select('*')
            .order('date', { ascending: false });

        if (dateRange.from) {
            query = query.gte('date', dateRange.from);
        }

        if (dateRange.to) {
            query = query.lte('date', dateRange.to);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching report statistics:', error);
        return { success: false, error: error.message, data: [] };
    }
};

/**
 * Add content to moderation queue
 * @param {Object} contentData - { content_id, content_type, flags, confidence, auto_action_taken }
 * @returns {Promise<Object>} - Created queue item
 */
export const addToModerationQueue = async (contentData) => {
    try {
        const { data, error } = await supabase
            .from('content_moderation_queue')
            .insert([contentData])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error adding to moderation queue:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Scan and moderate content
 * @param {Object} content - Content to scan { id, type, text, imageUrls }
 * @returns {Promise<Object>} - Moderation result
 */
export const scanAndModerateContent = async (content) => {
    try {
        // Run auto-moderation
        const moderationResult = await autoModerateContent({
            text: content.text,
            imageUrls: content.imageUrls || [],
            contentType: content.type
        });

        // If flagged, add to moderation queue
        if (moderationResult.shouldFlag) {
            await addToModerationQueue({
                content_id: content.id,
                content_type: content.type,
                flags: moderationResult.flags,
                confidence: moderationResult.confidence,
                auto_action_taken: moderationResult.action
            });
        }

        return { success: true, result: moderationResult };
    } catch (error) {
        console.error('Error scanning content:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get content reported multiple times
 * @param {number} minReports - Minimum number of reports
 * @returns {Promise<Array>} - Frequently reported content
 */
export const getFrequentlyReportedContent = async (minReports = 3) => {
    try {
        const { data, error } = await supabase
            .rpc('get_frequently_reported_content', { min_reports: minReports });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error getting frequently reported content:', error);
        return { success: false, error: error.message, data: [] };
    }
};

const _defaultModule = {
    submitReport,
    getReportsByUser,
    getReportQueue,
    updateReportStatus,
    getReportStatistics,
    addToModerationQueue,
    scanAndModerateContent,
    getFrequentlyReportedContent
};


export default _defaultModule;
