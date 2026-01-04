// Basic list of banned/flagged words/regex
// In a real app, this should be more comprehensive or loaded from a remote source/DB to avoid client-side inspection bypass (though client-side is good for immediate feedback).

export const exactBlocklist = [
    "badword1",
    "badword2",
    "hate_speech_term",
    "violent_term",
    // Add more terms here
];

export const regexBlocklist = [
    /bad\s*word/i,
    /hate\s*speech/i,
    // Add more regex here
];

export const checkKeywords = (text) => {
    if (!text) return { flagged: false, matches: [] };

    const lowerText = text.toLowerCase();
    const matches = [];

    // Check exact matches (simple inclusion)
    exactBlocklist.forEach(word => {
        if (lowerText.includes(word.toLowerCase())) {
            matches.push(word);
        }
    });

    // Check regex
    regexBlocklist.forEach(regex => {
        if (regex.test(text)) {
            matches.push(regex.toString());
        }
    });

    return {
        flagged: matches.length > 0,
        matches
    };
};
