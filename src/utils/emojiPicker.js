/**
 * Emoji picker utility
 */

export const commonEmojis = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
  '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
  '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
  '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦',
  '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
  '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿',
  '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖'
];

export const categories = {
  smileys: {
    name: 'Smileys & Emotion',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
      '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
      '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'
    ]
  },
  people: {
    name: 'People & Body',
    emojis: [
      '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝'
    ]
  },
  nature: {
    name: 'Animals & Nature',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇'
    ]
  },
  food: {
    name: 'Food & Drink',
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑',
      '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒',
      '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞'
    ]
  },
  activities: {
    name: 'Activities',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸'
    ]
  },
  travel: {
    name: 'Travel & Places',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🏍', '🛵', '🚲', '🛴', '🛺', '🚨',
      '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞'
    ]
  },
  objects: {
    name: 'Objects',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨', '🖥', '🖨', '🖱', '🖲', '🕹',
      '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
      '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚'
    ]
  },
  symbols: {
    name: 'Symbols',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'
    ]
  }
};

export const getEmojiByCategory = (categoryName) => {
  return categories[categoryName]?.emojis || [];
};

export const getAllEmojis = () => {
  return Object.values(categories).flatMap(category => category.emojis);
};

export const searchEmojis = (query) => {
  if (!query) return commonEmojis;
  
  const emojiMap = {
    // Smileys
    'happy': ['😀', '😃', '😄', '😁', '😊', '🙂', '😌', '🤩'],
    'sad': ['😞', '😔', '😟', '😕', '🙁', '☹️', '😢', '😭'],
    'love': ['😍', '🥰', '😘', '😗', '❤️', '💕', '💖', '💗'],
    'laugh': ['😂', '🤣', '😅', '😆'],
    'angry': ['😠', '😡', '🤬', '😤'],
    'surprised': ['😲', '😮', '😯', '🤯', '😱'],
    'cool': ['😎', '🤓', '😏'],
    'cry': ['😢', '😭', '🥺'],
    'sick': ['🤒', '🤕', '🤢', '🤮'],
    'sleep': ['😴', '😪', '🥱'],
    
    // Animals
    'cat': ['🐱', '🐈', '🦁'],
    'dog': ['🐶', '🐕'],
    'bird': ['🐦', '🐤', '🐣', '🐥', '🦅', '🦉'],
    'fish': ['🐟', '🐠', '🐡', '🦈'],
    'bear': ['🐻', '🐼'],
    'monkey': ['🐵', '🙈', '🙉', '🙊', '🐒'],
    
    // Food
    'food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥑'],
    'pizza': ['🍕'],
    'burger': ['🍔'],
    'cake': ['🎂', '🧁'],
    'coffee': ['☕', '🍵'],
    'beer': ['🍺', '🍻'],
    
    // Activities
    'sport': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐'],
    'music': ['🎵', '🎶', '🎤', '🎧', '🎸', '🎹'],
    'game': ['🎮', '🕹', '🎯', '🎲'],
    
    // Travel
    'car': ['🚗', '🚕', '🚙'],
    'plane': ['✈️', '🛩'],
    'train': ['🚂', '🚃', '🚄'],
    'bike': ['🚲', '🏍'],
    
    // Weather
    'sun': ['☀️', '🌞'],
    'rain': ['🌧', '☔', '💧'],
    'snow': ['❄️', '☃️', '⛄'],
    'cloud': ['☁️', '⛅', '🌤'],
    
    // Hearts
    'heart': ['❤️', '🧡', '💛', '💚', '💙', '💜'],
    
    // Hands
    'hand': ['👋', '✋', '👌', '✌️', '👍', '👎', '👏', '🙌'],
    'point': ['👈', '👉', '👆', '👇', '☝️'],
    
    // Time
    'time': ['⏰', '⏲', '⏱', '🕐', '🕑', '🕒']
  };
  
  const lowerQuery = query.toLowerCase();
  const matchingEmojis = [];
  
  for (const [keyword, emojis] of Object.entries(emojiMap)) {
    if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
      matchingEmojis.push(...emojis);
    }
  }
  
  return matchingEmojis.length > 0 ? matchingEmojis : commonEmojis.slice(0, 20);
};

export const getRandomEmoji = () => {
  const allEmojis = getAllEmojis();
  return allEmojis[Math.floor(Math.random() * allEmojis.length)];
};

export const getRandomEmojiFromCategory = (categoryName) => {
  const categoryEmojis = getEmojiByCategory(categoryName);
  if (categoryEmojis.length === 0) return getRandomEmoji();
  return categoryEmojis[Math.floor(Math.random() * categoryEmojis.length)];
};

export const isEmoji = (char) => {
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(char);
};

export const extractEmojis = (text) => {
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  return text.match(emojiRegex) || [];
};

export const removeEmojis = (text) => {
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  return text.replace(emojiRegex, '');
};

export const countEmojis = (text) => {
  const emojis = extractEmojis(text);
  return emojis.length;
};

export const replaceEmojiWithText = (text) => {
  const emojiToText = {
    '😀': ':grinning:',
    '😃': ':smiley:',
    '😄': ':smile:',
    '😁': ':grin:',
    '😅': ':sweat_smile:',
    '😂': ':joy:',
    '🤣': ':rofl:',
    '😊': ':blush:',
    '😇': ':innocent:',
    '🙂': ':slightly_smiling_face:',
    '🙃': ':upside_down_face:',
    '😉': ':wink:',
    '😌': ':relieved:',
    '😍': ':heart_eyes:',
    '🥰': ':smiling_face_with_hearts:',
    '😘': ':kissing_heart:',
    '❤️': ':heart:',
    '💔': ':broken_heart:',
    '👍': ':thumbsup:',
    '👎': ':thumbsdown:',
    '👏': ':clap:',
    '🙌': ':raised_hands:',
    '🤝': ':handshake:',
    '🔥': ':fire:',
    '⭐': ':star:',
    '🎉': ':tada:',
    '🎊': ':confetti_ball:'
  };
  
  let result = text;
  for (const [emoji, textRepresentation] of Object.entries(emojiToText)) {
    result = result.replace(new RegExp(emoji, 'g'), textRepresentation);
  }
  
  return result;
};

export const getEmojiUnicode = (emoji) => {
  return emoji.codePointAt(0).toString(16).toUpperCase();
};

export default {
  commonEmojis,
  categories,
  getEmojiByCategory,
  getAllEmojis,
  searchEmojis,
  getRandomEmoji,
  getRandomEmojiFromCategory,
  isEmoji,
  extractEmojis,
  removeEmojis,
  countEmojis,
  replaceEmojiWithText,
  getEmojiUnicode
};
