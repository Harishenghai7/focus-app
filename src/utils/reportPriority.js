// Report priority calculation algorithm
import { getSeverityLevel } from './reportCategories';

/**
 * Calculate report priority based on multiple factors
 * @param {Object} report - Report object
 * @param {Object} context - Additional context (existing reports, trust scores, etc.)
 * @returns {string} - Priority level: 'low', 'medium', 'high', or 'urgent'
 */
export const calculatePriority = async (report, context = {}) => {
    let priorityScore = 0;

    // 1. Category Severity (40% weight)
    const severity = getSeverityLevel(report.category, report.content_type);
    const severityScores = {
        urgent: 10,
        high: 7,
        medium: 4,
        low: 1
    };
    priorityScore += (severityScores[severity] || 0) * 0.4;

    // 2. Reporter Trust Score (20% weight)
    if (context.reporter_trust_score) {
        if (context.reporter_trust_score >= 80) {
            priorityScore += 3; // High trust reporter
        } else if (context.reporter_trust_score >= 60) {
            priorityScore += 2; // Medium trust
        } else if (context.reporter_trust_score < 40) {
            priorityScore -= 1; // Low trust (potential false report)
        }
    }

    // 3. Reported User Trust Score (20% weight)
    if (context.reported_user_trust_score) {
        if (context.reported_user_trust_score < 40) {
            priorityScore += 3; // Low trust user (more likely valid report)
        } else if (context.reported_user_trust_score < 60) {
            priorityScore += 1;
        }
    }

    // 4. Multiple Reports on Same Content (20% weight)
    if (context.existing_report_count) {
        if (context.existing_report_count >= 5) {
            priorityScore += 4; // 5+ reports = very high priority
        } else if (context.existing_report_count >= 3) {
            priorityScore += 3;
        } else if (context.existing_report_count >= 2) {
            priorityScore += 2;
        }
    }

    // 5. Evidence Provided (bonus)
    if (report.evidence_urls && report.evidence_urls.length > 0) {
        priorityScore += 1; // Reports with evidence are more credible
    }

    // Convert score to priority level
    if (priorityScore >= 8) return 'urgent';
    if (priorityScore >= 6) return 'high';
    if (priorityScore >= 3) return 'medium';
    return 'low';
};

/**
 * Calculate ticket priority based on category and keywords
 * @param {Object} ticket - Ticket object
 * @returns {string} - Priority level
 */
export const calculateTicketPriority = (ticket) => {
    // High priority categories
    const highPriorityCategories = ['account', 'privacy', 'billing'];

    // Urgent keywords
    const urgentKeywords = ['hacked', 'hack', 'stolen', 'fraud', 'scam', 'locked out', 'can\'t login', 'security breach', 'urgent'];

    const text = `${ticket.subject} ${ticket.description}`.toLowerCase();

    // Check for urgent keywords
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
        return 'urgent';
    }

    // Check category priority
    if (highPriorityCategories.includes(ticket.category)) {
        return 'high';
    }

    return 'medium';
};

/**
 * Get existing report count for content
 * @param {string} contentId - Content ID
 * @param {string} contentType - Content type
 * @param {Object} supabase - Supabase client
 * @returns {number} - Number of existing reports
 */
export const getExistingReportCount = async (contentId, contentType, supabase) => {
    try {
        const { count, error } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('reported_content_id', contentId)
            .eq('content_type', contentType)
            .in('status', ['pending', 'under_review']);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting existing report count:', error);
        return 0;
    }
};

/**
 * Get user trust score
 * @param {string} userId - User ID
 * @param {Object} supabase - Supabase client
 * @returns {number} - Trust score (0-100)
 */
export const getUserTrustScore = async (userId, supabase) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('trust_score')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data?.trust_score || 50; // Default to neutral
    } catch (error) {
        console.error('Error getting user trust score:', error);
        return 50;
    }
};

/**
 * Auto-escalate report if needed
 * @param {Object} report - Report object
 * @returns {boolean} - Whether to auto-escalate
 */
export const shouldAutoEscalate = (report) => {
    // Auto-escalate certain categories
    const autoEscalateCategories = ['self_harm', 'violence', 'underage'];

    if (autoEscalateCategories.includes(report.category)) {
        return true;
    }

    // Auto-escalate if priority is urgent
    if (report.priority === 'urgent') {
        return true;
    }

    return false;
};

const _defaultModule = {
    calculatePriority,
    calculateTicketPriority,
    getExistingReportCount,
    getUserTrustScore,
    shouldAutoEscalate
};


export default _defaultModule;
