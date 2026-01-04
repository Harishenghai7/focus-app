// Content auto-moderation utilities
// Uses keyword detection and pattern matching for text moderation
// Structure ready for nsfwjs image scanning upgrade

/**
 * Hate speech keywords database
 * Note: This is a basic list. In production, use a comprehensive database.
 */
const HATE_SPEECH_KEYWORDS = [
    // Add your moderation keywords here
    // This should be maintained separately and not committed to public repos
    'offensive1', 'offensive2', // Placeholders - replace with actual moderation keywords
];

/**
 * Spam patterns
 */
const SPAM_PATTERNS = {
    excessiveLinks: /https?:\/\/[^\s]+/gi,
    repeatedText: /(.{3,})\1{5,}/gi, // Repeated characters/words
    excessiveCaps: /[A-Z\s]{20,}/g, // Excessive caps
    phoneNumbers: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
};

/**
 * Scan text content for violations
 * @param {string} text - Text content to scan
 * @returns {Object} - { flags: string[], confidence: number }
 */
export const scanTextContent = async (text) => {
    if (!text || typeof text !== 'string') {
        return { flags: [], confidence: 0 };
    }

    const flags = [];
    const lowerText = text.toLowerCase();

    // 1. Check for hate speech keywords
    const hateWordCount = HATE_SPEECH_KEYWORDS.filter(word =>
        lowerText.includes(word.toLowerCase())
    ).length;

    if (hateWordCount > 0) {
        flags.push('hate_speech');
    }

    // 2. Check for spam patterns
    const linkMatches = text.match(SPAM_PATTERNS.excessiveLinks);
    if (linkMatches && linkMatches.length > 5) {
        flags.push('excessive_links');
    }

    const repeatedMatches = text.match(SPAM_PATTERNS.repeatedText);
    if (repeatedMatches && repeatedMatches.length > 0) {
        flags.push('spam_repetition');
    }

    const capsMatches = text.match(SPAM_PATTERNS.excessiveCaps);
    if (capsMatches && capsMatches.length > 2) {
        flags.push('excessive_caps');
    }

    // 3. Check for phishing/scam indicators
    const scamKeywords = ['click here', 'free money', 'winner', 'congratulations', 'claim now', 'limited time'];
    const scamCount = scamKeywords.filter(keyword => lowerText.includes(keyword)).length;

    if (scamCount >= 2 && linkMatches && linkMatches.length > 0) {
        flags.push('potential_scam');
    }

    // 4. Check for contact info spam (phone, email)
    const phoneMatches = text.match(SPAM_PATTERNS.phoneNumbers);
    const emailMatches = text.match(SPAM_PATTERNS.emails);

    if ((phoneMatches && phoneMatches.length > 2) || (emailMatches && emailMatches.length > 2)) {
        flags.push('contact_spam');
    }

    // Calculate confidence score (0.0 to 1.0)
    let confidence = 0;
    if (flags.length > 0) {
        confidence = Math.min(flags.length * 0.25, 1.0);
    }

    return { flags, confidence };
};

/**
 * Scan image for NSFW content using nsfwjs
 * @param {string} imageUrl - Image URL to scan
 * @returns {Object} - { flags: string[], confidence: number }
 * 
 * Note: This requires nsfwjs and @tensorflow/tfjs
 * Current implementation is a placeholder - full implementation requires model loading
 */
export const scanImageContent = async (imageUrl) => {
    // Placeholder for NSFW image detection
    // In production, integrate nsfwjs:
    /*
    import * as nsfwjs from 'nsfwjs';
    import * as tf from '@tensorflow/tfjs';
    
    const model = await nsfwjs.load();
    const img = await loadImage(imageUrl);
    const predictions = await model.classify(img);
    
    // predictions format: [
    //   { className: 'Porn', probability: 0.8 },
    //   { className: 'Hentai', probability: 0.1 },
    //   ...
    // ]
    
    const nsfwClasses = ['Porn', 'Hentai', 'Sexy'];
    const maxNsfwProbability = Math.max(...predictions
      .filter(p => nsfwClasses.includes(p.className))
      .map(p => p.probability)
    );
    
    if (maxNsfwProbability > 0.6) {
      return { flags: ['nsfw_content'], confidence: maxNsfwProbability };
    }
    */

    return { flags: [], confidence: 0 };
};

/**
 * Auto-moderate content
 * @param {Object} content - Content object { text, imageUrls, contentType }
 * @returns {Object} - { shouldHide, shouldFlag, flags, confidence, action }
 */
export const autoModerateContent = async (content) => {
    const allFlags = [];
    let maxConfidence = 0;

    // Scan text if provided
    if (content.text) {
        const textResult = await scanTextContent(content.text);
        allFlags.push(...textResult.flags);
        maxConfidence = Math.max(maxConfidence, textResult.confidence);
    }

    // Scan images if provided (future implementation)
    if (content.imageUrls && content.imageUrls.length > 0) {
        for (const imageUrl of content.imageUrls) {
            const imageResult = await scanImageContent(imageUrl);
            allFlags.push(...imageResult.flags);
            maxConfidence = Math.max(maxConfidence, imageResult.confidence);
        }
    }

    // Determine action based on flags and confidence
    let action = 'none';
    let shouldHide = false;
    let shouldFlag = false;

    if (allFlags.length > 0) {
        // High confidence violations -> auto-hide
        if (maxConfidence >= 0.8 || allFlags.includes('hate_speech')) {
            shouldHide = true;
            action = 'hidden';
        } else if (maxConfidence >= 0.5 || allFlags.length >= 2) {
            // Medium confidence -> flag for review
            shouldFlag = true;
            action = 'flagged';
        } else {
            // Low confidence -> just log
            shouldFlag = true;
            action = 'logged';
        }
    }

    return {
        shouldHide,
        shouldFlag,
        flags: [...new Set(allFlags)], // Remove duplicates
        confidence: maxConfidence,
        action
    };
};

/**
 * Check if user behavior is suspicious
 * @param {Object} userActivity - User activity data
 * @returns {boolean} - Whether behavior is suspicious
 */
export const checkSuspiciousBehavior = (userActivity) => {
    const {
        postsInLastHour = 0,
        followsInLastHour = 0,
        commentsInLastHour = 0,
        trustScore = 50
    } = userActivity;

    // Rapid posting
    if (postsInLastHour > 10) return true;

    // Mass following
    if (followsInLastHour > 50) return true;

    // Comment spam
    if (commentsInLastHour > 30) return true;

    // Low trust score + high activity
    if (trustScore < 30 && (postsInLastHour + commentsInLastHour) > 15) return true;

    return false;
};

/**
 * Detect phishing URLs
 * @param {string} url - URL to check
 * @returns {boolean} - Whether URL is suspicious
 */
export const isPhishingUrl = (url) => {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // Check for common phishing indicators
        const suspiciousPatterns = [
            /bit\.ly|tinyurl|goo\.gl/, // URL shorteners
            /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
            /-secure|-verify|-confirm|-account/, // Phishing keywords
            /free-.*-\d+/, // "free-something-123" pattern
        ];

        return suspiciousPatterns.some(pattern => pattern.test(hostname));
    } catch (e) {
        return false;
    }
};

export default {
    scanTextContent,
    scanImageContent,
    autoModerateContent,
    checkSuspiciousBehavior,
    isPhishingUrl
};
