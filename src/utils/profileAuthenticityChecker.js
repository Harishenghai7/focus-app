/**
 * Profile Authenticity Checker
 * 
 * Uses simulated AI logic to detect fake profiles, spam bios, and impersonation.
 */

// Simulated "AI" checks (in a real app, these would call an API)
export const checkProfileAuthenticity = async (profileData) => {
    const { username, bio, avatarUrl } = profileData;
    const flags = [];
    let score = 100; // Start with perfect authenticity

    // 1. Username Analysis
    if (isSuspiciousUsername(username)) {
        score -= 20;
        flags.push('Suspicious username pattern');
    }

    // 2. Bio Analysis (Spam detection)
    if (hasSpamKeywords(bio)) {
        score -= 30;
        flags.push('Spam keywords in bio');
    }

    // 3. Avatar Analysis (Simulated)
    // In reality, we'd send the image to a service
    if (!avatarUrl) {
        score -= 10;
        flags.push('No profile picture');
    }

    return {
        authenticityScore: score,
        isSuspicious: score < 60,
        flags
    };
};

const isSuspiciousUsername = (username) => {
    if (!username) return false;
    // Check for random strings like "user1238475"
    const digitCount = (username.match(/\d/g) || []).length;
    if (digitCount > 6) return true;

    // Check for reserved words
    const reserved = ['admin', 'support', 'staff', 'official', 'focus'];
    if (reserved.some(word => username.toLowerCase().includes(word))) return true;

    return false;
};

const hasSpamKeywords = (bio) => {
    if (!bio) return false;
    const spamWords = ['buy now', 'click here', 'crypto', 'investment', 'free followers'];
    return spamWords.some(word => bio.toLowerCase().includes(word));
};
