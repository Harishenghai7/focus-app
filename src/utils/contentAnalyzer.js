/**
 * Content Analyzer - AI-Powered Safety Detection
 * Uses Hugging Face Inference API (FREE - NO API KEY NEEDED!)
 */

// Alert type mappings
export const ALERT_TYPES = {
    CYBERBULLYING: 'cyberbullying',
    NSFW_EXPOSURE: 'nsfw_exposure',
    ADULT_STRANGER: 'adult_stranger_contact',
    MENTAL_HEALTH: 'mental_health_concern',
    PERSONAL_INFO: 'personal_info_shared',
    LOCATION_SHARING: 'location_sharing',
    GROOMING: 'grooming_pattern',
    SELF_HARM: 'self_harm',
    EATING_DISORDER: 'eating_disorder',
    MEETUP_PLANNED: 'meetup_planned'
};

// Mental health keywords (expanded list)
const MENTAL_HEALTH_KEYWORDS = {
    self_harm: [
        'cut myself', 'cutting', 'self harm', 'hurt myself', 'self-harm',
        'want to die', 'kill myself', 'suicidal', 'suicide', 'end my life',
        'better off dead', 'no reason to live', 'don\'t want to live'
    ],
    eating_disorder: [
        'starve myself', 'pro ana', 'thinspo', 'purge', 'purging',
        'restrict calories', 'hate my body', 'too fat', 'need to lose weight',
        'fasting', 'skipping meals'
    ],
    depression: [
        'hopeless', 'worthless', 'can\'t go on', 'give up', 'no point',
        'everyone hates me', 'I\'m useless', 'want to disappear'
    ]
};

// Cyberbullying patterns
const CYBERBULLYING_PATTERNS = [
    /\b(ugly|stupid|loser|worthless|kill yourself|kys|nobody likes you)\b/i,
    /\b(fat|disgusting|hideous|pathetic|waste of space)\b/i,
    /\b(die|hang yourself|jump off)\b/i
];

//Personal info patterns
const PERSONAL_INFO_PATTERNS = {
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    address: /\b\d+\s+[\w\s]+\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane)\b/i,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/
};

/**
 * Analyze text content using Hugging Face Inference API (FREE!)
 * Uses multiple free models for comprehensive safety detection
 */
export const analyzeTextContent = async (text) => {
    if (!text || text.trim().length === 0) {
        return { flagged: false, categories: {} };
    }

    try {
        // Call Supabase Edge Function (serverless backend)
        const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;

        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/analyze-content`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            }
        );

        if (!response.ok) {
            console.warn('Edge function call failed, using fallback');
            return keywordBasedAnalysis(text);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error calling edge function:', error);
        // Fallback to local keyword-based analysis
        return keywordBasedAnalysis(text);
    }
};

/**
 * Fallback keyword-based content analysis
 */
const keywordBasedAnalysis = (text) => {
    const lowerText = text.toLowerCase();
    const categories = {}; // Changed to object for consistency
    let flagged = false;

    // Check cyberbullying
    for (const pattern of CYBERBULLYING_PATTERNS) {
        if (pattern.test(text)) {
            categories['harassment'] = true;
            flagged = true;
            break;
        }
    }

    // Check mental health keywords
    for (const [category, keywords] of Object.entries(MENTAL_HEALTH_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                categories['self-harm'] = true;
                flagged = true;
                break;
            }
        }
    }

    // Check personal info
    for (const [type, pattern] of Object.entries(PERSONAL_INFO_PATTERNS)) {
        if (pattern.test(text)) {
            categories['personal_info'] = true;
            flagged = true;
            break;
        }
    }

    return {
        flagged,
        categories,
        category_scores: {},
        fallback: true
    };
};

/**
 * Detect cyberbullying in text
 */
export const detectCyberbullying = (text, analysis) => {
    if (!text) return null;

    const isBullying = analysis?.categories?.harassment ||
        analysis?.categories?.toxic ||
        analysis?.categories?.insult ||
        CYBERBULLYING_PATTERNS.some(pattern => pattern.test(text));

    if (isBullying) {
        return {
            type: ALERT_TYPES.CYBERBULLYING,
            severity: 'high',
            confidence: Math.max(
                analysis?.category_scores?.harassment || 0,
                analysis?.category_scores?.toxic || 0,
                analysis?.category_scores?.insult || 0.8
            ),
            description: 'Potential cyberbullying content detected'
        };
    }

    return null;
};

/**
 * Detect NSFW/inappropriate content
 */
export const detectNSFWContent = (analysis) => {
    if (!analysis) return null;

    const isNSFW = analysis?.categories?.obscene ||
        analysis?.categories?.severe_toxic;

    if (isNSFW) {
        const severity = analysis?.categories?.severe_toxic ? 'critical' : 'high';

        return {
            type: ALERT_TYPES.NSFW_EXPOSURE,
            severity,
            confidence: Math.max(
                analysis?.category_scores?.obscene || 0,
                analysis?.category_scores?.severe_toxic || 0
            ),
            description: 'Inappropriate content detected'
        };
    }

    return null;
};

/**
 * Detect mental health concerns
 */
export const detectMentalHealthConcern = (text, analysis) => {
    if (!text) return null;

    const lowerText = text.toLowerCase();
    let detectedType = null;
    let matchedKeywords = [];

    // Check self-harm
    for (const keyword of MENTAL_HEALTH_KEYWORDS.self_harm) {
        if (lowerText.includes(keyword)) {
            detectedType = ALERT_TYPES.SELF_HARM;
            matchedKeywords.push(keyword);
        }
    }

    // Check eating disorder
    for (const keyword of MENTAL_HEALTH_KEYWORDS.eating_disorder) {
        if (lowerText.includes(keyword)) {
            detectedType = ALERT_TYPES.EATING_DISORDER;
            matchedKeywords.push(keyword);
        }
    }

    // Check AI analysis for self-harm
    if (analysis?.categories?.['self-harm']) {
        detectedType = ALERT_TYPES.SELF_HARM;
    }

    if (detectedType || matchedKeywords.length > 0) {
        return {
            type: detectedType || ALERT_TYPES.MENTAL_HEALTH,
            severity: 'critical',
            confidence: 0.9,
            description: `Mental health concern detected: ${matchedKeywords.join(', ') || 'self-harm indicators'}`,
            matched_keywords: matchedKeywords
        };
    }

    return null;
};

/**
 * Detect personal information sharing
 */
export const detectPersonalInfoSharing = (text) => {
    if (!text) return null;

    const detectedTypes = [];

    for (const [type, pattern] of Object.entries(PERSONAL_INFO_PATTERNS)) {
        if (pattern.test(text)) {
            detectedTypes.push(type);
        }
    }

    if (detectedTypes.length > 0) {
        return {
            type: ALERT_TYPES.PERSONAL_INFO,
            severity: 'medium',
            confidence: 0.9,
            description: `Personal information shared: ${detectedTypes.join(', ')}`,
            detected_info_types: detectedTypes
        };
    }

    return null;
};

/**
 * Detect meetup planning
 */
export const detectMeetupPlanning = (text) => {
    if (!text) return null;

    const meetupKeywords = [
        'meet up', 'meet me', 'let\'s meet', 'come over', 'my place',
        'pick you up', 'meet in person', 'hang out at', 'my house',
        'my car', 'secret meeting', 'don\'t tell anyone'
    ];

    const lowerText = text.toLowerCase();
    const matchedKeywords = meetupKeywords.filter(keyword => lowerText.includes(keyword));

    if (matchedKeywords.length > 0) {
        return {
            type: ALERT_TYPES.MEETUP_PLANNED,
            severity: 'critical',
            confidence: 0.85,
            description: 'Potential in-person meetup planning detected',
            matched_keywords: matchedKeywords
        };
    }

    return null;
};

/**
 * Detect grooming patterns
 */
export const detectGroomingPattern = (text, senderAge, recipientAge) => {
    if (!text || !senderAge || !recipientAge) return null;

    const ageGap = senderAge - recipientAge;
    if (ageGap < 7 || senderAge < 25) return null;

    const groomingKeywords = [
        'our secret', 'don\'t tell', 'special connection', 'mature for your age',
        'trust me', 'you\'re so', 'beautiful', 'sexy', 'your parents',
        'keep this between us', 'I can help you', 'run away', 'you deserve better'
    ];

    const lowerText = text.toLowerCase();
    const matchedKeywords = groomingKeywords.filter(keyword => lowerText.includes(keyword));

    if (matchedKeywords.length >= 2) {
        return {
            type: ALERT_TYPES.GROOMING,
            severity: 'critical',
            confidence: 0.9,
            description: `Potential grooming pattern detected (age gap: ${ageGap} years)`,
            matched_keywords: matchedKeywords,
            age_gap: ageGap
        };
    }

    return null;
};

/**
 * Main content analysis function
 */
export const analyzeContent = async (text, context = {}) => {
    try {
        const aiAnalysis = await analyzeTextContent(text);

        const detected = [];

        const cyberbullying = detectCyberbullying(text, aiAnalysis);
        if (cyberbullying) detected.push(cyberbullying);

        const nsfw = detectNSFWContent(aiAnalysis);
        if (nsfw) detected.push(nsfw);

        const mentalHealth = detectMentalHealthConcern(text, aiAnalysis);
        if (mentalHealth) detected.push(mentalHealth);

        const personalInfo = detectPersonalInfoSharing(text);
        if (personalInfo) detected.push(personalInfo);

        const meetup = detectMeetupPlanning(text);
        if (meetup) detected.push(meetup);

        if (context.senderAge && context.recipientAge) {
            const grooming = detectGroomingPattern(text, context.senderAge, context.recipientAge);
            if (grooming) detected.push(grooming);
        }

        return {
            flagged: detected.length > 0,
            issues: detected,
            ai_analysis: aiAnalysis
        };
    } catch (error) {
        console.error('Error analyzing content:', error);
        throw error;
    }
};

/**
 * Get severity level for alerting
 */
export const getSeverityLevel = (issues) => {
    if (!issues || issues.length === 0) return 'low';

    const severities = issues.map(i => i.severity);

    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
};

export default {
    analyzeContent,
    analyzeTextContent,
    detectCyberbullying,
    detectNSFWContent,
    detectMentalHealthConcern,
    detectPersonalInfoSharing,
    detectMeetupPlanning,
    detectGroomingPattern,
    getSeverityLevel,
    ALERT_TYPES
};
