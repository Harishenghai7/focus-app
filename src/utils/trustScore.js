/**
 * Calculate trust score based on multiple factors
 * Returns a score from 0-100
 */
export const calculateTrustScore = (userData) => {
    let score = 0;
    const weights = {
        emailVerified: 15,
        phoneVerified: 15,
        governmentIdVerified: 25,
        biometricEnabled: 10,
        deviceTrusted: 10,
        accountAge: 10,
        activityConsistency: 10,
        reportHistory: 5
    };

    // Email verification (15 points)
    if (userData.email_verified) {
        score += weights.emailVerified;
    }

    // Phone verification (15 points)
    if (userData.phone_verified) {
        score += weights.phoneVerified;
    }

    // Government ID verification (25 points)
    if (userData.government_id_verified) {
        score += weights.governmentIdVerified;
    }

    // Biometric authentication enabled (10 points)
    if (userData.biometric_enabled) {
        score += weights.biometricEnabled;
    }

    // Trusted device count (10 points max)
    const trustedDevices = userData.trusted_devices || 0;
    if (trustedDevices > 0) {
        score += Math.min(trustedDevices * 5, weights.deviceTrusted);
    }

    // Account age (10 points max)
    // Full points after 6 months
    if (userData.created_at) {
        const accountAgeMonths = (Date.now() - new Date(userData.created_at)) / (1000 * 60 * 60 * 24 * 30);
        score += Math.min((accountAgeMonths / 6) * weights.accountAge, weights.accountAge);
    }

    // Activity consistency (10 points max)
    // Based on regular login patterns
    const loginStreak = userData.login_streak || 0;
    if (loginStreak > 0) {
        score += Math.min((loginStreak / 30) * weights.activityConsistency, weights.activityConsistency);
    }

    // Report history (5 points - deducted if reports exist)
    const reportCount = userData.report_count || 0;
    if (reportCount === 0) {
        score += weights.reportHistory;
    } else if (reportCount <= 2) {
        score += weights.reportHistory / 2;
    }
    // No points if more than 2 reports

    return Math.round(Math.min(score, 100));
};

/**
 * Get trust level based on score
 */
export const getTrustLevel = (score) => {
    if (score >= 80) return { level: 'Excellent', color: '#10b981', icon: '🛡️' };
    if (score >= 60) return { level: 'Good', color: '#3b82f6', icon: '✅' };
    if (score >= 40) return { level: 'Fair', color: '#f59e0b', icon: '⚠️' };
    if (score >= 20) return { level: 'Low', color: '#ef4444', icon: '⚡' };
    return { level: 'Very Low', color: '#dc2626', icon: '❌' };
};

/**
 * Get recommendations to improve trust score
 */
export const getTrustRecommendations = (userData) => {
    const recommendations = [];

    if (!userData.email_verified) {
        recommendations.push({
            action: 'Verify your email',
            points: 15,
            priority: 'high'
        });
    }

    if (!userData.phone_verified) {
        recommendations.push({
            action: 'Verify your phone number',
            points: 15,
            priority: 'high'
        });
    }

    if (!userData.government_id_verified) {
        recommendations.push({
            action: 'Complete government ID verification',
            points: 25,
            priority: 'high'
        });
    }

    if (!userData.biometric_enabled) {
        recommendations.push({
            action: 'Enable biometric authentication',
            points: 10,
            priority: 'medium'
        });
    }

    const trustedDevices = userData.trusted_devices || 0;
    if (trustedDevices === 0) {
        recommendations.push({
            action: 'Add a trusted device',
            points: 5,
            priority: 'medium'
        });
    }

    return recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
};
