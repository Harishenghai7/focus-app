// Support category definitions for the Focus app

export const SUPPORT_CATEGORIES = [
    {
        id: 'account',
        label: 'Account Issues',
        description: 'Login problems, password reset, account recovery',
        icon: '👤',
        priority: 'high',
        avgResponseTime: '2 hours'
    },
    {
        id: 'bug',
        label: 'Technical Bugs',
        description: 'App errors, crashes, loading issues',
        icon: '🐛',
        priority: 'medium',
        avgResponseTime: '4 hours'
    },
    {
        id: 'feature_request',
        label: 'Feature Requests',
        description: 'Suggest new features or improvements',
        icon: '💡',
        priority: 'low',
        avgResponseTime: '1 week'
    },
    {
        id: 'privacy',
        label: 'Privacy / Security',
        description: 'Data concerns, hacking attempts, privacy questions',
        icon: '🔒',
        priority: 'high',
        avgResponseTime: '2 hours'
    },
    {
        id: 'billing',
        label: 'Billing / Payments',
        description: 'Payment issues, subscriptions, refunds',
        icon: '💳',
        priority: 'high',
        avgResponseTime: '4 hours'
    },
    {
        id: 'general',
        label: 'General Questions',
        description: 'How-to guides, general inquiries',
        icon: '❓',
        priority: 'low',
        avgResponseTime: '1 day'
    }
];

// FAQ data for support center
export const FAQ_DATA = [
    {
        category: 'account',
        questions: [
            {
                q: 'How do I reset my password?',
                a: 'Go to Settings → Account → Change Password, or use "Forgot Password" on the login screen.'
            },
            {
                q: 'How can I verify my account?',
                a: 'Visit Settings → Account → Verification to apply for account verification.'
            },
            {
                q: 'Can I change my username?',
                a: 'Yes! Go to Settings → Account → Username and update it (you can change it once every 30 days).'
            }
        ]
    },
    {
        category: 'privacy',
        questions: [
            {
                q: 'How do I make my account private?',
                a: 'Go to Settings → Privacy & Security → Private Account and toggle it on.'
            },
            {
                q: 'Who can see my posts?',
                a: 'Public accounts: everyone. Private accounts: only approved followers. You can also select visibility per post.'
            },
            {
                q: 'How do I block someone?',
                a: 'Go to their profile → three dots → Block User.'
            }
        ]
    },
    {
        category: 'bug',
        questions: [
            {
                q: 'The app is not loading. What should I do?',
                a: 'Try refreshing the page, clearing cache, or restarting the app. If the issue persists, contact support.'
            },
            {
                q: 'My posts are not uploading',
                a: 'Check your internet connection, ensure the file size is under 100MB, and try again.'
            }
        ]
    },
    {
        category: 'general',
        questions: [
            {
                q: 'What are Boltz?',
                a: 'Boltz are short-form videos similar to TikTok/Reels, perfect for quick, engaging content.'
            },
            {
                q: 'What is the difference between posts and Flashes?',
                a: 'Posts are permanent feed content. Flashes (Flash Stories) disappear after 24 hours like Instagram Stories.'
            },
            {
                q: 'How do I report inappropriate content?',
                a: 'Click the three dots on any content → Report → Select category → Submit.'
            }
        ]
    }
];

// Ticket status options
export const TICKET_STATUSES = {
    open: {
        label: 'Open',
        color: '#2196F3',
        icon: '🆕'
    },
    in_progress: {
        label: 'In Progress',
        color: '#FFC107',
        icon: '⏳'
    },
    resolved: {
        label: 'Resolved',
        color: '#4CAF50',
        icon: '✅'
    },
    closed: {
        label: 'Closed',
        color: '#9E9E9E',
        icon: '🔒'
    }
};

// Canned responses for admins
export const CANNED_RESPONSES = [
    {
        id: 'password_reset',
        title: 'Password Reset Instructions',
        content: `Thank you for contacting Focus Support.

To reset your password:
1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your email for reset link
5. Follow the link to create a new password

If you don't receive the email within 5 minutes, check your spam folder or contact us again.

Best regards,
Focus Support Team`
    },
    {
        id: 'account_verification',
        title: 'Account Verification Process',
        content: `Thank you for your interest in verifying your account.

To apply for verification:
1. Go to Settings → Account → Verification
2. Fill out the verification application
3. Provide required documents (ID, proof of authenticity)
4. Submit the application

Our team will review your application within 3-5 business days.

Best regards,
Focus Support Team`
    },
    {
        id: 'general_thanks',
        title: 'Thank You',
        content: `Thank you for contacting Focus Support. We're happy to help!

If resolved, feel free to contact us again.

Best regards,
Focus Support Team`
    },
    {
        id: 'escalating',
        title: 'Escalating to Engineering',
        content: `Thank you for reporting this issue.

We've escalated your case to our engineering team for further investigation. They will look into this and get back to you within 24-48 hours.

We appreciate your patience!

Best regards,
Focus Support Team`
    }
];

// Get category by ID
export const getCategoryById = (categoryId) => {
    return SUPPORT_CATEGORIES.find(cat => cat.id === categoryId);
};

// Get FAQs by category
export const getFAQsByCategory = (categoryId) => {
    const categoryData = FAQ_DATA.find(c => c.category === categoryId);
    return categoryData?.questions || [];
};

// Search FAQs
export const searchFAQs = (query) => {
    if (!query || query.trim().length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const results = [];

    FAQ_DATA.forEach(categoryData => {
        categoryData.questions.forEach(faq => {
            if (
                faq.q.toLowerCase().includes(lowerQuery) ||
                faq.a.toLowerCase().includes(lowerQuery)
            ) {
                results.push({
                    ...faq,
                    category: categoryData.category
                });
            }
        });
    });

    return results;
};

export default {
    SUPPORT_CATEGORIES,
    FAQ_DATA,
    TICKET_STATUSES,
    CANNED_RESPONSES,
    getCategoryById,
    getFAQsByCategory,
    searchFAQs
};
