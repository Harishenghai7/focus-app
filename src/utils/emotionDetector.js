/**
 * Emotion Detection Utility
 * Analyzes text and detects appropriate emotion for Focusly
 */

/**
 * Detect emotion from text content
 * @param {string} text - Text to analyze
 * @param {string} sender - 'user' or 'focusly'
 * @returns {string} Emotion name
 */
export const detectEmotion = (text, sender = 'focusly') => {
  if (!text) return 'idle';
  
  const lowerText = text.toLowerCase();
  
  // CELEBRATION / EXCITEMENT
  const excitementPatterns = [
    'amazing', 'awesome', 'fantastic', 'incredible', 'wonderful',
    'yay', 'woohoo', 'congratulations', 'congrats', 'celebrate',
    'won', 'win', 'passed', 'success', 'achievement', 'accomplished',
    '🎉', '🌟', '✨', '🎊', '🏆'
  ];
  if (excitementPatterns.some(word => lowerText.includes(word))) {
    return 'excited';
  }
  
  // HAPPINESS / JOY
  const happyPatterns = [
    'happy', 'glad', 'great', 'good', 'nice', 'pleased',
    'thank', 'thanks', 'appreciate', 'love it', 'perfect',
    '😊', '😄', '🙂', '☺️'
  ];
  if (happyPatterns.some(word => lowerText.includes(word))) {
    return 'happy';
  }
  
  // SADNESS / EMPATHY
  const sadPatterns = [
    'sad', 'sorry', 'down', 'upset', 'depressed', 'crying',
    'cry', 'hurt', 'pain', 'lonely', 'miss', 'lost',
    'unfortunate', 'tough', 'difficult', 'hard time',
    '😢', '😭', '🥺', '😔'
  ];
  if (sadPatterns.some(word => lowerText.includes(word))) {
    return 'sad';
  }
  
  // THINKING / PONDERING
  const thinkingPatterns = [
    'think', 'wonder', 'consider', 'hmm', 'let me',
    'analyzing', 'figuring', 'working on', 'trying to understand',
    'not sure', 'maybe', 'perhaps', 'could be',
    '🤔', '💭'
  ];
  if (thinkingPatterns.some(word => lowerText.includes(word))) {
    return 'thinking';
  }
  
  // SURPRISE / SHOCK
  const surprisePatterns = [
    'really', 'wow', 'whoa', 'omg', 'no way', 'seriously',
    'can\'t believe', 'shocking', 'surprised', 'unexpected',
    '😲', '😮', '🤯'
  ];
  if (surprisePatterns.some(word => lowerText.includes(word))) {
    return 'surprised';
  }
  
  // LOVE / CARE
  const lovePatterns = [
    'love', 'care', 'support', 'here for you', 'always',
    'friend', 'hug', 'comfort', 'understand',
    '❤️', '💙', '💚', '💜', '🥰', '💕'
  ];
  if (lovePatterns.some(word => lowerText.includes(word))) {
    return 'loving';
  }
  
  // CONFUSED
  const confusedPatterns = [
    'confused', 'don\'t understand', 'what', 'huh', 'unclear',
    'not getting', 'explain', 'help me understand',
    '😕', '🤷'
  ];
  if (confusedPatterns.some(word => lowerText.includes(word))) {
    return 'confused';
  }
  
  // WORKING / FOCUSED
  const workingPatterns = [
    'working', 'studying', 'homework', 'assignment', 'project',
    'task', 'focus', 'concentrate', 'learning', 'practice',
    '📚', '✍️', '💻'
  ];
  if (workingPatterns.some(word => lowerText.includes(word))) {
    return 'working';
  }
  
  // TIRED / SLEEPY
  const sleepyPatterns = [
    'tired', 'sleepy', 'exhausted', 'drowsy', 'yawn',
    'need sleep', 'bed time', 'fatigue',
    '😴', '🥱'
  ];
  if (sleepyPatterns.some(word => lowerText.includes(word))) {
    return 'sleepy';
  }
  
  // COOL / CONFIDENT
  const coolPatterns = [
    'cool', 'awesome', 'nice', 'got it', 'understood',
    'makes sense', 'i see', 'alright', 'okay',
    '😎', '👍', '✌️'
  ];
  if (coolPatterns.some(word => lowerText.includes(word))) {
    return 'cool';
  }
  
  // GREETINGS (waving)
  const greetingPatterns = [
    'hi', 'hello', 'hey', 'yo', 'sup', 'howdy',
    'good morning', 'good afternoon', 'good evening',
    '👋', 'wave'
  ];
  if (greetingPatterns.some(word => lowerText.includes(word))) {
    return 'waving';
  }
  
  // Questions default to thinking (for user) or happy (for Focusly)
  if (lowerText.includes('?')) {
    return sender === 'user' ? 'thinking' : 'happy';
  }
  
  // Default emotions
  return sender === 'user' ? 'thinking' : 'happy';
};

/**
 * Get emotion intensity (for animation speed/scale)
 * @param {string} text - Text to analyze
 * @returns {number} Intensity (0.5 - 1.5)
 */
export const getEmotionIntensity = (text) => {
  if (!text) return 1.0;
  
  const lowerText = text.toLowerCase();
  
  // High intensity indicators
  const highIntensity = ['!!!', '!!!!', 'very', 'so', 'extremely', 'super', 'amazing'];
  if (highIntensity.some(indicator => lowerText.includes(indicator))) {
    return 1.5;
  }
  
  // Low intensity indicators
  const lowIntensity = ['a bit', 'slightly', 'kind of', 'sort of', 'maybe'];
  if (lowIntensity.some(indicator => lowerText.includes(indicator))) {
    return 0.7;
  }
  
  return 1.0; // Normal intensity
};

/**
 * Detect if response needs special animation
 * @param {string} text - Text to analyze
 * @returns {string|null} Special animation name or null
 */
export const detectSpecialAnimation = (text) => {
  const lowerText = text.toLowerCase();
  
  // Dancing celebration
  if (/dance|party|celebrate/i.test(text)) return 'dancing';
  
  // Meditation/calm
  if (/meditate|calm|relax|breathe/i.test(text)) return 'meditating';
  
  // Running/exercise
  if (/run|exercise|workout|fitness/i.test(text)) return 'running';
  
  // Studying/reading
  if (/study|read|learn|book/i.test(text)) return 'working';
  
  // Birthday
  if (/birthday|cake|candle/i.test(text)) return 'birthday';
  
  // Graduation
  if (/graduate|graduation|degree|diploma/i.test(text)) return 'graduation';
  
  return null;
};

/**
 * Map emotions to animation states
 */
export const EMOTION_TO_ANIMATION = {
  idle: 'idle',
  happy: 'happy',
  excited: 'excited',
  sad: 'sad',
  thinking: 'thinking',
  surprised: 'surprised',
  loving: 'love',
  confused: 'confused',
  working: 'working',
  sleepy: 'sleepy',
  cool: 'cool',
  waving: 'waving',
  dancing: 'dancing',
  meditating: 'meditating',
  running: 'running',
  birthday: 'birthday',
  graduation: 'graduation',
};

export default detectEmotion;
