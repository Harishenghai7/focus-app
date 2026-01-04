/**
 * Lip Sync Helper for Focusly Avatar
 * Maps speech to mouth shapes (visemes) for realistic lip sync
 */

/**
 * Viseme types (mouth shapes)
 */
export const VISEMES = {
    NEUTRAL: 'neutral',      // Mouth closed, relaxed
    OPEN: 'open',           // Mouth open (A, E, I)
    WIDE: 'wide',           // Mouth wide (EE, AY)
    ROUND: 'round',         // Mouth rounded (O, U, W)
    SMALL: 'small',         // Small opening (M, B, P)
    TEETH: 'teeth',         // Teeth showing (S, Z, TH)
    SMILE: 'smile'          // Smiling (happy expression)
};

/**
 * Phoneme to viseme mapping
 * Based on common English phonemes
 */
const PHONEME_TO_VISEME = {
    // Vowels
    'a': VISEMES.OPEN,
    'e': VISEMES.OPEN,
    'i': VISEMES.WIDE,
    'o': VISEMES.ROUND,
    'u': VISEMES.ROUND,

    // Consonants
    'm': VISEMES.SMALL,
    'b': VISEMES.SMALL,
    'p': VISEMES.SMALL,
    'f': VISEMES.TEETH,
    'v': VISEMES.TEETH,
    's': VISEMES.TEETH,
    'z': VISEMES.TEETH,
    'th': VISEMES.TEETH,
    'w': VISEMES.ROUND,
    'r': VISEMES.ROUND,

    // Default
    'default': VISEMES.NEUTRAL
};

/**
 * Word to viseme mapping (simplified approach)
 * Maps common letter patterns to mouth shapes
 */
const LETTER_TO_VISEME = {
    'a': VISEMES.OPEN,
    'e': VISEMES.WIDE,
    'i': VISEMES.WIDE,
    'o': VISEMES.ROUND,
    'u': VISEMES.ROUND,
    'w': VISEMES.ROUND,
    'm': VISEMES.SMALL,
    'b': VISEMES.SMALL,
    'p': VISEMES.SMALL,
    'f': VISEMES.TEETH,
    'v': VISEMES.TEETH,
    's': VISEMES.TEETH,
    'z': VISEMES.TEETH,
    'default': VISEMES.NEUTRAL
};

/**
 * Generate lip sync timeline from text
 * @param {string} text - Text to be spoken
 * @param {number} duration - Expected duration in milliseconds
 * @returns {Array} Timeline of visemes with timestamps
 */
export const generateLipSyncTimeline = (text, duration) => {
    const words = text.toLowerCase().split(/\s+/);
    const timeline = [];
    const avgWordDuration = duration / words.length;

    let currentTime = 0;

    words.forEach((word, index) => {
        const wordDuration = avgWordDuration;
        const letters = word.split('');
        const letterDuration = wordDuration / letters.length;

        letters.forEach((letter, letterIndex) => {
            const viseme = LETTER_TO_VISEME[letter] || VISEMES.NEUTRAL;
            const timestamp = currentTime + (letterIndex * letterDuration);

            timeline.push({
                time: timestamp,
                viseme: viseme,
                letter: letter,
                word: word
            });
        });

        currentTime += wordDuration;

        // Add neutral pause between words
        if (index < words.length - 1) {
            timeline.push({
                time: currentTime,
                viseme: VISEMES.NEUTRAL,
                letter: ' ',
                word: ''
            });
            currentTime += 50; // 50ms pause
        }
    });

    // End with neutral
    timeline.push({
        time: duration,
        viseme: VISEMES.NEUTRAL,
        letter: '',
        word: ''
    });

    return timeline;
};

/**
 * Get viseme for current time in timeline
 * @param {Array} timeline - Lip sync timeline
 * @param {number} currentTime - Current time in milliseconds
 * @returns {string} Current viseme
 */
export const getCurrentViseme = (timeline, currentTime) => {
    if (!timeline || timeline.length === 0) {
        return VISEMES.NEUTRAL;
    }

    // Find the viseme for current time
    for (let i = timeline.length - 1; i >= 0; i--) {
        if (currentTime >= timeline[i].time) {
            return timeline[i].viseme;
        }
    }

    return timeline[0].viseme;
};

/**
 * Create lip sync from speech boundary events
 * @param {SpeechSynthesisEvent} event - Speech boundary event
 * @param {string} text - Full text being spoken
 * @returns {string} Viseme for current boundary
 */
export const getVisemeFromBoundary = (event, text) => {
    if (!event || !text) {
        return VISEMES.NEUTRAL;
    }

    // Get character at current position
    const charIndex = event.charIndex;
    const char = text[charIndex]?.toLowerCase();

    return LETTER_TO_VISEME[char] || VISEMES.NEUTRAL;
};

/**
 * Estimate speech duration based on text length and rate
 * @param {string} text - Text to be spoken
 * @param {number} rate - Speech rate (0.1 to 10, default 1)
 * @returns {number} Estimated duration in milliseconds
 */
export const estimateSpeechDuration = (text, rate = 1) => {
    // Average speaking rate: ~150 words per minute
    // Adjusted by speech rate
    const words = text.split(/\s+/).length;
    const baseWPM = 150;
    const adjustedWPM = baseWPM * rate;
    const minutes = words / adjustedWPM;
    const milliseconds = minutes * 60 * 1000;

    return Math.max(milliseconds, 500); // Minimum 500ms
};

/**
 * Smooth transition between visemes
 * @param {string} fromViseme - Starting viseme
 * @param {string} toViseme - Target viseme
 * @param {number} progress - Transition progress (0 to 1)
 * @returns {Object} Interpolated viseme data
 */
export const interpolateVisemes = (fromViseme, toViseme, progress) => {
    // For CSS animations, we can use the progress value
    // to blend between keyframes
    return {
        from: fromViseme,
        to: toViseme,
        progress: progress,
        current: progress < 0.5 ? fromViseme : toViseme
    };
};

/**
 * Get random idle mouth movement
 * For when not speaking
 */
export const getIdleMouthMovement = () => {
    const movements = [
        VISEMES.NEUTRAL,
        VISEMES.NEUTRAL,
        VISEMES.NEUTRAL,
        VISEMES.SMALL,  // Occasional small movements
        VISEMES.NEUTRAL
    ];

    return movements[Math.floor(Math.random() * movements.length)];
};

/**
 * Get viseme for emotion
 * @param {string} emotion - Emotion name
 * @returns {string} Appropriate viseme
 */
export const getEmotionViseme = (emotion) => {
    const emotionVisemes = {
        happy: VISEMES.SMILE,
        excited: VISEMES.WIDE,
        sad: VISEMES.SMALL,
        surprised: VISEMES.OPEN,
        thinking: VISEMES.SMALL,
        neutral: VISEMES.NEUTRAL
    };

    return emotionVisemes[emotion] || VISEMES.NEUTRAL;
};

/**
 * Create simplified lip sync for short phrases
 * @param {string} text - Text to sync
 * @returns {Array} Simplified timeline
 */
export const createSimpleLipSync = (text) => {
    const hasVowels = /[aeiou]/i.test(text);
    const hasRounds = /[ouw]/i.test(text);
    const hasTeeth = /[fvszth]/i.test(text);

    const sequence = [];

    if (hasVowels) sequence.push(VISEMES.OPEN);
    if (hasRounds) sequence.push(VISEMES.ROUND);
    if (hasTeeth) sequence.push(VISEMES.TEETH);

    // Add neutral between each
    const timeline = [];
    sequence.forEach((viseme, index) => {
        timeline.push(viseme);
        if (index < sequence.length - 1) {
            timeline.push(VISEMES.NEUTRAL);
        }
    });

    return timeline.length > 0 ? timeline : [VISEMES.NEUTRAL];
};

export default {
    VISEMES,
    generateLipSyncTimeline,
    getCurrentViseme,
    getVisemeFromBoundary,
    estimateSpeechDuration,
    interpolateVisemes,
    getIdleMouthMovement,
    getEmotionViseme,
    createSimpleLipSync
};
