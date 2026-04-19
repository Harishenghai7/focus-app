// Report category definitions for the Focus app
// Defines all report categories with metadata

export const REPORT_CATEGORIES = {
    // For Posts, Boltz, Flash Stories, Comments
    POST_CONTENT: [
        {
            id: 'spam',
            label: 'Spam',
            description: 'Unwanted promotional content or repetitive posts',
            icon: '🚫',
            severity: 'medium'
        },
        {
            id: 'hate_speech',
            label: 'Hate Speech / Harassment',
            description: 'Abusive language, bullying, or targeted harassment',
            icon: '⚠️',
            severity: 'high'
        },
        {
            id: 'violence',
            label: 'Violence / Dangerous Content',
            description: 'Threats, graphic violence, or dangerous behavior',
            icon: '🔴',
            severity: 'urgent'
        },
        {
            id: 'nsfw',
            label: 'Nudity / Sexual Content',
            description: 'Adult content or sexually explicit material',
            icon: '🔞',
            severity: 'high'
        },
        {
            id: 'false_info',
            label: 'False Information',
            description: 'Misleading or false claims',
            icon: '❌',
            severity: 'medium'
        },
        {
            id: 'ip_violation',
            label: 'Copyright / IP Violation',
            description: 'Stolen content or intellectual property infringement',
            icon: '©️',
            severity: 'medium'
        },
        {
            id: 'self_harm',
            label: 'Self-Harm / Suicide',
            description: 'Content promoting self-harm or suicide',
            icon: '🆘',
            severity: 'urgent'
        },
        {
            id: 'other',
            label: 'Other',
            description: 'Something else not listed here',
            icon: '💬',
            severity: 'low'
        }
    ],

    // For User Profiles
    USER_PROFILE: [
        {
            id: 'fake_account',
            label: 'Fake Account',
            description: 'Bot, spam account, or impersonation',
            icon: '🤖',
            severity: 'high'
        },
        {
            id: 'impersonation',
            label: 'Impersonation',
            description: 'Pretending to be someone else',
            icon: '🎭',
            severity: 'high'
        },
        {
            id: 'harassment',
            label: 'Harassment / Bullying',
            description: 'Harassing or bullying others',
            icon: '😠',
            severity: 'high'
        },
        {
            id: 'spam_account',
            label: 'Spam Account',
            description: 'Account dedicated to spamming',
            icon: '📢',
            severity: 'medium'
        },
        {
            id: 'underage',
            label: 'Underage User',
            description: 'User appears to be under 13 years old',
            icon: '👶',
            severity: 'high'
        },
        {
            id: 'other',
            label: 'Other',
            description: 'Something else',
            icon: '💬',
            severity: 'low'
        }
    ],

    // For Messages
    MESSAGE: [
        {
            id: 'harassment',
            label: 'Harassment',
            description: 'Abusive or threatening messages',
            icon: '😡',
            severity: 'high'
        },
        {
            id: 'spam',
            label: 'Spam',
            description: 'Unwanted promotional messages',
            icon: '🚫',
            severity: 'medium'
        },
        {
            id: 'scam',
            label: 'Scam / Fraud',
            description: 'Phishing, scam, or fraud attempt',
            icon: '🎣',
            severity: 'high'
        },
        {
            id: 'unwanted_contact',
            label: 'Unwanted Contact',
            description: 'Unsolicited messages',
            icon: '🙅',
            severity: 'low'
        },
        {
            id: 'other',
            label: 'Other',
            description: 'Something else',
            icon: '💬',
            severity: 'low'
        }
    ]
};

// Get categories by content type
export const getCategoriesByType = (contentType) => {
    switch (contentType) {
        case 'post':
        case 'boltz':
        case 'flash':
        case 'comment':
            return REPORT_CATEGORIES.POST_CONTENT;
        case 'profile':
        case 'user':
            return REPORT_CATEGORIES.USER_PROFILE;
        case 'message':
        case 'conversation':
            return REPORT_CATEGORIES.MESSAGE;
        default:
            return REPORT_CATEGORIES.POST_CONTENT;
    }
};

// Get category by ID
export const getCategoryById = (categoryId, contentType) => {
    const categories = getCategoriesByType(contentType);
    return categories.find(cat => cat.id === categoryId);
};

// Get severity level
export const getSeverityLevel = (categoryId, contentType) => {
    const category = getCategoryById(categoryId, contentType);
    return category?.severity || 'low';
};

// Priority mapping
export const PRIORITY_LEVELS = {
    urgent: {
        label: 'Urgent',
        color: '#FF4444',
        weight: 4
    },
    high: {
        label: 'High',
        color: '#FF8C00',
        weight: 3
    },
    medium: {
        label: 'Medium',
        color: '#FFC107',
        weight: 2
    },
    low: {
        label: 'Low',
        color: '#9D7FEA',
        weight: 1
    }
};

// Status options
export const REPORT_STATUSES = {
    pending: {
        label: 'Pending',
        color: '#FFC107',
        icon: '⏳'
    },
    under_review: {
        label: 'Under Review',
        color: '#2196F3',
        icon: '🔍'
    },
    resolved: {
        label: 'Resolved',
        color: '#4CAF50',
        icon: '✅'
    },
    dismissed: {
        label: 'Dismissed',
        color: '#9E9E9E',
        icon: '❌'
    }
};

// Admin actions
export const ADMIN_ACTIONS = [
    {
        id: 'dismiss',
        label: 'Dismiss Report',
        description: 'Report is not valid',
        severity: 'low'
    },
    {
        id: 'warning',
        label: 'Send Warning',
        description: 'Send warning message to user',
        severity: 'low'
    },
    {
        id: 'remove_content',
        label: 'Remove Content',
        description: 'Delete the reported content',
        severity: 'medium'
    },
    {
        id: 'restrict_account',
        label: 'Restrict Account',
        description: 'Limit account actions',
        severity: 'medium'
    },
    {
        id: 'suspend_1d',
        label: 'Suspend for 1 Day',
        description: 'Temporary 24h ban',
        severity: 'high'
    },
    {
        id: 'suspend_7d',
        label: 'Suspend for 7 Days',
        description: 'Temporary 1 week ban',
        severity: 'high'
    },
    {
        id: 'suspend_30d',
        label: 'Suspend for 30 Days',
        description: 'Temporary 1 month ban',
        severity: 'high'
    },
    {
        id: 'ban_permanent',
        label: 'Ban Permanently',
        description: 'Permanent account removal',
        severity: 'urgent'
    }
];

const _defaultModule = {
    REPORT_CATEGORIES,
    getCategoriesByType,
    getCategoryById,
    getSeverityLevel,
    PRIORITY_LEVELS,
    REPORT_STATUSES,
    ADMIN_ACTIONS
};


export default _defaultModule;
