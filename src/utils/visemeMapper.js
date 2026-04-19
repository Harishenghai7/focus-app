/**
 * Phoneme to Viseme Mapper
 * Maps speech sounds to mouth shapes for lip sync
 */

/**
 * Viseme types based on mouth shapes
 */
export const VisemeType = {
    NEUTRAL: 'neutral',
    MOUTH_OPEN: 'mouth_open',       // A, Ah sounds
    MOUTH_WIDE: 'mouth_wide',       // E, Eh sounds
    MOUTH_SMILE: 'mouth_smile',     // I, Ee sounds
    MOUTH_ROUND: 'mouth_round',     // O, Oh sounds
    MOUTH_PUCKER: 'mouth_pucker',   // U, Oo sounds
    MOUTH_CLOSED: 'mouth_closed',   // M, B, P sounds
    MOUTH_TEETH: 'mouth_teeth',     // F, V sounds
    MOUTH_WIDE_OPEN: 'mouth_wide_open' // Big expressions
};

/**
 * Phoneme to viseme mapping
 * Based on International Phonetic Alphabet (IPA)
 */
const phonemeToVisemeMap = {
    // Vowels
    'a': VisemeType.MOUTH_OPEN,
    'æ': VisemeType.MOUTH_OPEN,
    'ɑ': VisemeType.MOUTH_WIDE_OPEN,
    'ʌ': VisemeType.MOUTH_OPEN,

    'e': VisemeType.MOUTH_WIDE,
    'ɛ': VisemeType.MOUTH_WIDE,
    'ə': VisemeType.MOUTH_OPEN,

    'i': VisemeType.MOUTH_SMILE,
    'ɪ': VisemeType.MOUTH_SMILE,

    'o': VisemeType.MOUTH_ROUND,
    'ɔ': VisemeType.MOUTH_ROUND,
    'ɒ': VisemeType.MOUTH_ROUND,

    'u': VisemeType.MOUTH_PUCKER,
    'ʊ': VisemeType.MOUTH_PUCKER,

    // Consonants
    'm': VisemeType.MOUTH_CLOSED,
    'b': VisemeType.MOUTH_CLOSED,
    'p': VisemeType.MOUTH_CLOSED,

    'f': VisemeType.MOUTH_TEETH,
    'v': VisemeType.MOUTH_TEETH,

    // Default for other consonants
    't': VisemeType.MOUTH_WIDE,
    'd': VisemeType.MOUTH_WIDE,
    'k': VisemeType.MOUTH_OPEN,
    'g': VisemeType.MOUTH_OPEN,
    'n': VisemeType.MOUTH_OPEN,
    'l': VisemeType.MOUTH_OPEN,
    'r': VisemeType.MOUTH_OPEN,
    's': VisemeType.MOUTH_SMILE,
    'z': VisemeType.MOUTH_SMILE,
    'ʃ': VisemeType.MOUTH_PUCKER,
    'ʒ': VisemeType.MOUTH_PUCKER,
    'θ': VisemeType.MOUTH_TEETH,
    'ð': VisemeType.MOUTH_TEETH,
    'h': VisemeType.MOUTH_OPEN,
    'w': VisemeType.MOUTH_PUCKER,
    'j': VisemeType.MOUTH_SMILE
};

/**
 * Character-based viseme mapping (simpler, for basic lip sync)
 */
const charToVisemeMap = {
    'a': VisemeType.MOUTH_OPEN,
    'e': VisemeType.MOUTH_WIDE,
    'i': VisemeType.MOUTH_SMILE,
    'o': VisemeType.MOUTH_ROUND,
    'u': VisemeType.MOUTH_PUCKER,
    'm': VisemeType.MOUTH_CLOSED,
    'b': VisemeType.MOUTH_CLOSED,
    'p': VisemeType.MOUTH_CLOSED,
    'f': VisemeType.MOUTH_TEETH,
    'v': VisemeType.MOUTH_TEETH,
    'w': VisemeType.MOUTH_PUCKER,
    's': VisemeType.MOUTH_SMILE,
    'z': VisemeType.MOUTH_SMILE
};

/**
 * Get viseme for a character (simple method)
 * @param {string} char - Character to map
 * @returns {string} Viseme type
 */
export const getVisemeForChar = (char) => {
    const lowerChar = char.toLowerCase();
    return charToVisemeMap[lowerChar] || VisemeType.NEUTRAL;
};

/**
 * Get viseme for a phoneme (advanced method)
 * @param {string} phoneme - IPA phoneme
 * @returns {string} Viseme type
 */
export const getVisemeForPhoneme = (phoneme) => {
    return phonemeToVisemeMap[phoneme] || VisemeType.NEUTRAL;
};

/**
 * Analyze text and return sequence of visemes
 * @param {string} text - Text to analyze
 * @returns {Array} Array of {char, viseme, duration} objects
 */
export const getVisemeSequence = (text) => {
    const sequence = [];
    const words = text.split(' ');

    words.forEach((word, wordIndex) => {
        const chars = word.split('');

        chars.forEach((char, charIndex) => {
            if (/[a-zA-Z]/.test(char)) {
                const viseme = getVisemeForChar(char);
                sequence.push({
                    char,
                    viseme,
                    duration: 100, // Approximate duration in ms
                    position: sequence.length
                });
            }
        });

        // Add pause between words
        if (wordIndex < words.length - 1) {
            sequence.push({
                char: ' ',
                viseme: VisemeType.NEUTRAL,
                duration: 50,
                position: sequence.length
            });
        }
    });

    return sequence;
};

/**
 * Get viseme based on word boundary event from Speech Synthesis
 * @param {SpeechSynthesisEvent} event - Boundary event
 * @returns {string} Viseme type
 */
export const getVisemeFromBoundaryEvent = (event) => {
    if (!event || event.name !== 'word') {
        return VisemeType.NEUTRAL;
    }

    const text = event.utterance.text;
    const charIndex = event.charIndex;

    if (charIndex >= 0 && charIndex < text.length) {
        const char = text[charIndex];
        return getVisemeForChar(char);
    }

    return VisemeType.NEUTRAL;
};

/**
 * Estimate speaking duration for text
 * @param {string} text - Text to speak
 * @param {number} rate - Speech rate (0.1 to 10)
 * @returns {number} Estimated duration in milliseconds
 */
export const estimateSpeakingDuration = (text, rate = 1.0) => {
    // Average speaking rate: ~150 words per minute at rate 1.0
    const wordsPerMinute = 150 * rate;
    const words = text.split(/\s+/).length;
    const minutes = words / wordsPerMinute;
    return Math.ceil(minutes * 60 * 1000);
};

/**
 * Get viseme intensity/expression level
 * @param {string} viseme - Viseme type
 * @param {number} volume - Volume level (0-1)
 * @returns {number} Intensity (0-1)
 */
export const getVisemeIntensity = (viseme, volume = 1.0) => {
    const baseIntensity = {
        [VisemeType.NEUTRAL]: 0,
        [VisemeType.MOUTH_OPEN]: 0.7,
        [VisemeType.MOUTH_WIDE]: 0.6,
        [VisemeType.MOUTH_SMILE]: 0.5,
        [VisemeType.MOUTH_ROUND]: 0.6,
        [VisemeType.MOUTH_PUCKER]: 0.7,
        [VisemeType.MOUTH_CLOSED]: 0.3,
        [VisemeType.MOUTH_TEETH]: 0.4,
        [VisemeType.MOUTH_WIDE_OPEN]: 1.0
    };

    return (baseIntensity[viseme] || 0.5) * volume;
};

const _defaultModule = {
    VisemeType,
    getVisemeForChar,
    getVisemeForPhoneme,
    getVisemeSequence,
    getVisemeFromBoundaryEvent,
    estimateSpeakingDuration,
    getVisemeIntensity
};


export default _defaultModule;
