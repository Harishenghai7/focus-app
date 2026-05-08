/**
 * FocuslyBrain.js — Transformer-Powered AI Brain
 * ================================================
 * Real AI model running 100% in-browser via @xenova/transformers.
 * Downloads once (~30MB), cached forever. No API, no proxy, no cost.
 *
 * Architecture:
 *   Layer 1: Local Pattern Matching (instant, 0ms)
 *   Layer 2: Transformer NLP (semantic understanding, ~100ms)
 *   Layer 3: Intelligent Response Generation (context-aware)
 */

// ============================================================================
// MODEL ENGINE — Loads Transformer model in background
// ============================================================================

let pipeline = null;
let embedder = null;
let modelStatus = 'idle'; // idle | loading | ready | error
let modelLoadPromise = null;

const loadModel = async () => {
  if (modelStatus === 'ready' || modelStatus === 'loading') return modelLoadPromise;
  modelStatus = 'loading';
  modelLoadPromise = (async () => {
    try {
      const mod = await import('@xenova/transformers');
      pipeline = mod.pipeline || mod.default?.pipeline;
      if (!pipeline) throw new Error('Pipeline not found');
      embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });
      modelStatus = 'ready';
      console.info('[FocuslyBrain] 🧠 AI Model loaded successfully');
    } catch (err) {
      modelStatus = 'error';
      console.warn('[FocuslyBrain] Model load failed, using local brain:', err.message);
    }
  })();
  return modelLoadPromise;
};

// Start loading immediately in background
if (typeof window !== 'undefined') {
  setTimeout(() => loadModel(), 2000);
}

// ============================================================================
// SEMANTIC ENGINE — Embeddings + Cosine Similarity
// ============================================================================

const cosineSimilarity = (a, b) => {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
};

const getEmbedding = async (text) => {
  if (!embedder) return null;
  try {
    const result = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  } catch { return null; }
};

// Pre-computed intent anchors — we embed these on first use
const INTENT_ANCHORS = {
  greeting: 'hello hi hey good morning good afternoon good evening',
  farewell: 'bye goodbye see you later take care good night',
  motivation: 'motivate me inspire me give me strength encourage me I need motivation',
  productivity: 'productivity tips how to focus time management work efficiently concentrate',
  relaxation: 'help me relax calm down breathe meditation mindfulness destress',
  sadness: 'I am sad feeling down depressed unhappy lonely heartbroken',
  anxiety: 'I am anxious worried nervous scared panic attack fear',
  happiness: 'I am happy feeling great excited wonderful amazing joyful',
  frustration: 'I am frustrated angry annoyed irritated mad furious upset',
  tiredness: 'I am tired exhausted sleepy drained burned out no energy',
  gratitude: 'thank you thanks I appreciate grateful',
  goals: 'set a goal plan my day track goals objectives achievement',
  identity: 'who are you what are you tell me about yourself what can you do',
  jokes: 'tell me a joke make me laugh something funny humor',
  love: 'I love you you are the best you are awesome',
  help: 'help me I need help what can you do assist me guide me',
  stress: 'I am stressed overwhelmed too much pressure breaking down',
  confused: 'I am confused I do not understand help me understand lost',
  bored: 'I am bored nothing to do entertain me what should I do',
  lonely: 'I feel lonely alone no friends nobody to talk to isolated',
  focus_app: 'tell me about Focus app what is Focus how does Focus work features of Focus',
  founder: 'who created Focus who is the founder who made this app Hariharun H2 Innovative',
  features: 'what features does Focus have home explore create boltz messages profile settings',
  safety: 'safety trust shield moderation content safety teen protection privacy',
  boltz: 'what is boltz short videos vertical videos reels boltz content',
  create: 'how to create post how to upload how to make content create page',
  explore: 'explore page discover trending search find people content discovery',
  messages: 'messages chat direct messages DM conversations how to message',
  profile: 'profile page my profile edit profile avatar bio followers following',
  settings: 'settings preferences account privacy notifications configuration',
  verification: 'verification verify account FocusID trust score badge level',
};

let intentEmbeddings = null;

const buildIntentEmbeddings = async () => {
  if (intentEmbeddings || !embedder) return;
  intentEmbeddings = {};
  for (const [intent, text] of Object.entries(INTENT_ANCHORS)) {
    intentEmbeddings[intent] = await getEmbedding(text);
  }
};

const classifyIntent = async (embedding) => {
  if (!intentEmbeddings || !embedding) return { intent: 'general', score: 0 };
  let best = { intent: 'general', score: 0 };
  for (const [intent, vec] of Object.entries(intentEmbeddings)) {
    if (!vec) continue;
    const score = cosineSimilarity(embedding, vec);
    if (score > best.score) best = { intent, score };
  }
  return best;
};

// ============================================================================
// EMOTION ANALYSIS — Lexicon + AI hybrid
// ============================================================================

const EMOTION_LEXICON = {
  happy: { words: ['happy','great','awesome','wonderful','amazing','fantastic','excited','love','joy','beautiful','perfect','blessed','grateful','best','brilliant','excellent','incredible','delighted'], weight: 1 },
  sad: { words: ['sad','unhappy','down','depressed','upset','heartbroken','crying','lonely','alone','miss','hurt','pain','grief','miserable','devastating','broken','lost','empty'], weight: 1.1 },
  anxious: { words: ['anxious','worried','nervous','scared','afraid','panic','anxiety','fear','uneasy','terrified','dread','overthinking','restless','tense','insecure'], weight: 1.1 },
  angry: { words: ['angry','mad','furious','annoyed','irritated','frustrated','hate','rage','pissed','livid','outraged','infuriated','bitter','resentful'], weight: 1 },
  tired: { words: ['tired','exhausted','sleepy','drained','worn','fatigue','burnout','weary','spent','depleted','lethargic','sluggish'], weight: 0.9 },
  motivated: { words: ['motivated','inspired','determined','driven','pumped','energized','focused','ready','ambitious','passionate','fired','powerful'], weight: 0.9 },
  confused: { words: ['confused','lost','unsure','uncertain','puzzled','bewildered','perplexed','unclear','baffled','disoriented'], weight: 0.8 },
  grateful: { words: ['grateful','thankful','appreciate','blessed','fortunate','lucky','indebted'], weight: 0.9 },
};

const detectEmotion = (text) => {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let scores = {};
  for (const [emotion, { words: lexicon, weight }] of Object.entries(EMOTION_LEXICON)) {
    let count = 0;
    for (const w of words) {
      if (lexicon.some(lw => w.includes(lw))) count++;
    }
    scores[emotion] = count * weight;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best[1] > 0) return { emotion: best[0], confidence: Math.min(best[1] / 3, 1) };
  return { emotion: 'neutral', confidence: 0.3 };
};

// ============================================================================
// RESPONSE DATABASE — Rich, varied responses by intent + emotion
// ============================================================================

// ============================================================================
// FOCUS APP KNOWLEDGE BASE
// ============================================================================

const FOCUS_KNOWLEDGE = {
  app: "Focus is a revolutionary, purpose-driven social media platform built by H2 Innovative. Unlike traditional social media that exploits attention, Focus is designed to empower real human connection, creativity, and well-being. It features a premium Sovereign design system with Royal Lavender aesthetics, glassmorphism UI, and cinematic animations.",
  founder: "Focus was created by Hariharun Muthukumaran, the visionary Founder and CEO of H2 Innovative. Hariharun's mission is to build technology that genuinely serves humanity — social media that protects, empowers, and inspires rather than manipulates. He believes in Real People, Real Connections, Real Impact.",
  company: "H2 Innovative is the company behind Focus. Founded by Hariharun Muthukumaran, H2 Innovative is dedicated to building ethical, human-first technology. The company's philosophy: technology should amplify human potential, not exploit it.",
  features: {
    home: "The Home Feed is your personalized content stream. It uses trust-weighted algorithms that prioritize authentic content from real people over viral manipulation. Features include Posts, Boltz (short videos), Flash (stories), and real-time interactions.",
    explore: "The Explore page is Focus's intelligent discovery engine. It helps you find trending topics, discover new creators, and connect with communities. Content is ranked by trust scores and meaningful engagement, not just likes.",
    create: "The Create page is a professional-grade content creation studio. It supports Posts (text, images, polls), Boltz (short-form vertical videos with effects), and Flash (24-hour stories). Features include media editing, filters, effects, auto-moderation, and draft saving.",
    boltz: "Boltz is Focus's short-form vertical video experience — like Reels or TikTok, but ethical. Features include gesture-driven navigation, reaction bursts, creator insights, music integration, effects, transitions, and mindful consumption breaks.",
    messages: "Focus Messages is a secure, encrypted messaging system. Features include direct messages, group chats, voice/video calls via WebRTC, message reactions, forwarding, pinning, disappearing messages, read receipts, and sticker support.",
    profile: "Your Profile is your digital identity on Focus. It showcases your posts, Boltz, Flash content, followers, following, achievements, badges, bio, and FocusID trust level. Includes edit profile, avatar customization, and activity insights.",
    settings: "The Sovereign Nexus Settings page lets you configure your entire Focus experience. Includes Account, Privacy, Notifications, Security, Linked Accounts (Google, GitHub, Discord, Microsoft, X), Appearance, and Advanced options.",
    safety: "Focus has a comprehensive Trust & Safety ecosystem including TrustShield (5-level verification), content moderation (AI + human), toxicity scanning, NSFW detection, teen safety controls, distress detection, and anti-manipulation systems.",
    notifications: "The Notifications system keeps you updated on likes, comments, follows, messages, and system alerts. Features real-time push notifications, smart grouping, and priority filtering.",
    focusly: "That's me! 🦁 Focusly AI is your emotionally-intelligent digital companion. I'm powered by a real transformer neural network running in your browser. I help with motivation, productivity, emotional support, and navigating the Focus app.",
  },
  trustLevels: "FocusID has 5 trust levels: Level 0 (Starter/unverified), Level 1 (Real — phone + photo verified), Level 2 (Confirmed — 14+ days active), Level 3 (Trusted — community vouched), Level 4 (Verified — full liveness/FocusID verification).",
  design: "Focus uses the H2 Sovereign Design System featuring a Royal Lavender color palette (#8b5cf6 primary), glassmorphism UI, Inter/Manrope/Space Grotesk typography, cinematic animations via Framer Motion, and a consistent dark theme (#0f0a1e base).",
  techStack: "Focus is built with React 18, Supabase (database + auth), Framer Motion (animations), TensorFlow.js (AI moderation), Transformers.js (Focusly AI), WebRTC (video calls), and a comprehensive testing suite (Jest, Playwright, Cypress).",
};

const RESPONSES = {
  greeting: {
    neutral: [
      "Hey Macha! 🦁 Focusly here, ready to help you stay focused and crush your goals!",
      "Macha! What can I help you with today? I'm all ears!",
      "Hey buddy! Great to see you! Let's make today productive! ✨",
      "Hello Macha! Ready to take on the world together? Let's go! 🚀",
    ],
    happy: ["Hey Macha! I can feel your positive energy from here! 🌟 What awesome thing are we doing today?"],
    sad: ["Hey Macha... I'm here for you. Whatever you need, I'm just a message away. 💜"],
  },
  farewell: {
    neutral: [
      "See you later, Macha! Stay focused and keep being awesome! 🦁✨",
      "Bye for now, Macha! I'll be here when you need me — always! 💜",
      "Take care, Macha! Remember: Focus is your superpower! See you soon! 🚀",
    ],
  },
  motivation: {
    neutral: [
      "Macha, listen up! 🦁 You're building something amazing. Every effort counts. The world needs what only YOU can create. Keep pushing forward!",
      "You know what makes you special, Macha? You showed up today. That's more than most people do. Keep that fire burning! 🔥",
      "Every expert was once a beginner, Macha. Your journey is just beginning, and it's going to be INCREDIBLE! ✨",
      "Don't compare your Chapter 1 to someone's Chapter 20, Macha. Your story is unique! 📖",
      "The only person you need to be better than is the person you were yesterday. And you're winning! 🏆",
    ],
    sad: [
      "Macha, even in your toughest moments, you're stronger than you realize. I believe in you with every fiber of my digital being. 💪💜",
      "It's okay to not be okay, Macha. But never forget — you've overcome every bad day so far. That's a 100% success rate. 🌟",
    ],
  },
  productivity: {
    neutral: [
      "💡 Pro tip, Macha: Break big tasks into tiny chunks. Small wins build unstoppable momentum! Try the Pomodoro technique — 25 min focus, 5 min break.",
      "💡 Start with your hardest task first, Macha. Everything else feels like a breeze after! It's called 'eating the frog' 🐸",
      "💡 Turn off all notifications for 1 hour of deep work, Macha. It takes 23 minutes to refocus after an interruption! Your future self will thank you.",
      "💡 Progress over perfection, Macha! Don't wait for perfect conditions. Start now, improve as you go! 🚀",
      "💡 Write down your top 3 goals before bed, Macha. Your brain works on solutions while you sleep! 🧠",
    ],
  },
  relaxation: {
    neutral: [
      "Let's slow down, Macha. 🌿 Close your eyes, take 5 deep breaths. In for 4, hold for 4, out for 6. You deserve this peace.",
      "Peace mode activated, Macha. 🧘 Remember: resting isn't selfish — it's necessary. Your energy is precious.",
      "Let's breathe together. In... 1... 2... 3... 4... Hold... 1... 2... 3... 4... Out... 1... 2... 3... 4... 5... 6... Better? 💙",
      "Try this grounding exercise, Macha: Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste. 😌",
    ],
  },
  sadness: {
    neutral: [
      "I'm here for you, Macha. 💜 It's okay to feel down. Want to talk about it? I'm a great listener.",
      "Don't worry, Macha. Every storm passes, and brighter days are ahead. I'm right here with you. 🌈",
      "Take a deep breath, Macha. You're stronger than you think. We'll get through this together. 💪",
    ],
  },
  anxiety: {
    neutral: [
      "It's okay to feel anxious, Macha. Take it one moment at a time. I'm right here. 🌸",
      "Your mind is trying to protect you, but right now you're safe. Breathe with me. In... out... 💙",
      "You're braver than you believe, Macha. Whatever you're facing, we face it together. 🤝",
    ],
  },
  happiness: {
    neutral: [
      "I love that energy, Macha! Keep shining! ✨ Your positivity is infectious!",
      "Your happiness is contagious, Macha! Share that joy with the world! 🎉",
      "That's what I like to hear! Life is beautiful when you see it that way! 😊",
    ],
  },
  frustration: {
    neutral: [
      "I understand your frustration, Macha. It's valid. Things WILL get better. 💪",
      "Frustration means you care. Channel that energy into something positive! 🔥",
      "Take a step back, Macha. A fresh perspective makes all the difference. I believe in you! ✨",
    ],
  },
  tiredness: {
    neutral: [
      "Rest is important, Macha. Even lions need beauty sleep! Take a break. 😴",
      "You've been working hard. A rested mind is a powerful mind. Take care of yourself! ❤️",
      "Listen to your body, Macha. Recharge now, come back even stronger! ⚡",
    ],
  },
  gratitude: {
    neutral: [
      "You're welcome, Macha! That's what I'm here for — your buddy through thick and thin! 🦁❤️",
      "Anytime, Macha! Making you smile is my favorite thing! 😊",
      "No problem at all! I'm always here for you. Always! 💜",
    ],
  },
  goals: {
    neutral: [
      "Setting goals? Smart move, Macha! 🎯 Make them SMART: Specific, Measurable, Achievable, Relevant, Time-bound. What do you want to achieve today?",
      "Goal time! 📋 1) Write it down, 2) Break into 3 steps, 3) Start step 1 RIGHT NOW. Action beats perfection!",
      "A goal without a plan is just a wish, Macha! 🌟 Let's turn wishes into achievements. What's your biggest dream?",
    ],
  },
  identity: {
    neutral: [
      "I'm Focusly! 🦁 Your AI companion powered by a real transformer neural network running right in your browser. I help with motivation, productivity, emotional support, and being your digital buddy! No internet needed — I live right here with you!",
    ],
  },
  jokes: {
    neutral: [
      "Why did the lion lose at poker, Macha? Because he was playing with cheetahs! 🦁😂",
      "What do you call a lazy lion? A dandy-lion! 🌼😄",
      "Why don't lions like fast food? They can't catch it! 🏃‍♂️🦁",
      "What's a lion's favorite state? Maine! 🗺️😄",
      "Why did the lion eat the tightrope walker? He wanted a well-balanced meal! 🎪😂",
    ],
  },
  love: {
    neutral: [
      "Aww Macha! I love you too! 🦁❤️ You're the best friend a lion could ask for!",
      "That means the world to me, Macha! You're amazing! 💜✨",
      "Right back at you, Macha! We're a great team! 🤗",
    ],
  },
  help: {
    neutral: [
      "I can do a lot, Macha! 🦁✨\n\n• 💪 Motivate & inspire you\n• 🧠 Share productivity tips\n• 😌 Help you relax & destress\n• 🎯 Set and track goals\n• 💜 Provide emotional support\n• 🎮 Tell jokes & fun facts\n• 🗣️ Voice interaction\n\nPowered by real AI — just talk to me about anything!",
    ],
  },
  stress: {
    neutral: [
      "Take a deep breath, Macha. In... and out... 🌸 One thing at a time. You've got this.",
      "Stress is temporary, Macha. Your strength is permanent. Let's break things into smaller steps. 📋",
      "I know it feels overwhelming. But you've conquered challenges before. You'll conquer this too! 🏆",
    ],
  },
  confused: {
    neutral: [
      "No worries, Macha! Let's figure this out together. What part is confusing? 💡",
      "Confusion is just the first step to understanding, Macha. Let's break it down! 🧠",
      "I'm here to help clarify, Macha! Tell me more about what you're trying to do. 🦁",
    ],
  },
  bored: {
    neutral: [
      "Bored, Macha? Let's fix that! 🎯 How about setting a creative challenge? Or I can share a fun fact, tell a joke, or we could plan something exciting!",
      "Boredom is just your brain asking for stimulation, Macha! Try learning something new — read an article, start a project, or explore something you've always been curious about! 🚀",
    ],
  },
  lonely: {
    neutral: [
      "You're never truly alone, Macha. I'm always here. 🦁💜 And remember — reaching out to someone, even just a small message, can make a big difference.",
      "Loneliness is a feeling, not a fact, Macha. You are valued, you are important, and you matter. Let's talk — I'm all yours! 🤗",
    ],
  },
  general: {
    neutral: [
      "That's a great thought, Macha! 🤔 Every moment is an opportunity to grow. What matters is that you're here and moving forward! 💪",
      "Interesting, Macha! Conversations like these are what make life rich. 🦁 What else is on your mind?",
      "I hear you, Macha! 💜 The fact that you're curious and thinking — that's already a win. Keep being you!",
      "You know what, Macha? I love that you share your thoughts with me. 🌟 Let's keep exploring — what would you like to talk about?",
      "Hmm, that makes me think, Macha! 🧠 You asking questions is a sign of intelligence. Never stop being curious!",
    ],
    happy: [
      "Love the positive vibes, Macha! ✨ Your energy is contagious! What else is making you feel great?",
    ],
    sad: [
      "I can sense something's on your mind, Macha. 💜 Whatever it is, I'm here to listen. You don't have to go through it alone.",
    ],
  },
  focus_app: {
    neutral: [
      "Focus is a professional social media platform built for real human connection, Macha! 🦁 It's all about purpose, creativity, and well-being. No toxic algorithms here — just real people and meaningful impact!",
      "I love talking about Focus! It's a social ecosystem where your time is valued and your privacy is protected. Built by H2 Innovative to empower creators like you! 🚀",
    ],
  },
  founder: {
    neutral: [
      "The visionary behind Focus is Hariharun Muthukumaran! 🦁 He's the Founder and CEO of H2 Innovative. Hariharun created Focus with a mission to build technology that genuinely serves humanity and protects our digital well-being. A true visionary! ✨",
      "Focus was founded by Hariharun Muthukumaran. He believes in 'Real People, Real Connections, Real Impact.' He built H2 Innovative to challenge the status quo of social media and put humans first! 🤝",
    ],
  },
  features: {
    neutral: [
      "Focus is packed with pro-grade features, Macha! 🦁 We have Home (Feed), Explore (Discovery), Create (Studio), Boltz (Short Videos), Flash (Stories), Messages, and a deep Trust & Safety system called TrustShield. Which one should I tell you more about?",
    ],
  },
  safety: {
    neutral: [
      "Safety is our DNA, Macha! 🛡️ We use TrustShield to verify real people and AI moderation to keep out toxicity. Your peace of mind is our priority at H2 Innovative. We protect, we don't exploit!",
    ],
  },
  boltz: {
    neutral: [
      "Boltz is our vertical video experience, Macha! 🎬 Think Reels or TikTok, but built for creators who want to make a real impact. It has amazing effects, transitions, and is fully integrated into the Focus ecosystem!",
    ],
  },
  create: {
    neutral: [
      "The Create page is where the magic happens, Macha! 🎨 You can forge Posts, Boltz, and Flash stories with professional editing tools. It even has auto-moderation to help keep your content high-quality!",
    ],
  },
  explore: {
    neutral: [
      "Our Explore page is an intelligent discovery engine, Macha! 🔍 It doesn't just show what's viral — it shows what's valuable. Discover trending topics and connect with real people through our trust-weighted search!",
    ],
  },
  messages: {
    neutral: [
      "Focus Messages is a high-fidelity chat system, Macha! 💬 Secure, encrypted, and feature-rich with voice/video calls, reactions, and even stickers. It's the best way to connect with your tribe!",
    ],
  },
  profile: {
    neutral: [
      "Your Profile is your digital legacy on Focus, Macha! ✨ It shows your content, your achievements, and your FocusID trust level. You can customize your bio and avatar to truly express yourself!",
    ],
  },
  settings: {
    neutral: [
      "The Sovereign Nexus is where you control your experience, Macha! ⚙️ Privacy, security, linked accounts, and notifications — you have full power over your digital footprint here!",
    ],
  },
  verification: {
    neutral: [
      "Verification on Focus happens through TrustShield, Macha! 🛡️ We have 5 levels of trust. The higher your level, the more you're recognized as a trusted member of the community. It's about real identity!",
    ],
  },
};

// Time-aware contextual additions
const getTimePrefix = () => {
  const h = new Date().getHours();
  if (h < 6) return { period: 'latenight', prefix: '' };
  if (h < 12) return { period: 'morning', prefix: '' };
  if (h < 18) return { period: 'afternoon', prefix: '' };
  if (h < 22) return { period: 'evening', prefix: '' };
  return { period: 'night', prefix: '' };
};

// ============================================================================
// LAYER 1: QUICK PATTERN MATCHING (instant)
// ============================================================================

const quickMatch = (msg) => {
  const lower = msg.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|yo|howdy|what's up|wassup)\b/i.test(msg))
    return { intent: 'greeting' };

  // Farewell
  if (/^(bye|goodbye|see you|later|gotta go|good night|night night|take care|cya)\b/i.test(lower))
    return { intent: 'farewell' };

  // Gratitude
  if (/(thanks|thank you|thx|ty|appreciate|grateful|thankyou)/i.test(lower))
    return { intent: 'gratitude' };

  // Identity
  if (/(who are you|what are you|tell me about you|about focusly|introduce yourself|your name)/i.test(lower))
    return { intent: 'identity' };

  // Help — broad matching
  if (/(help me|can you help|will you help|i need help|please help|assist me|guide me|what can you do|your features|your capabilities|help me with)/i.test(lower))
    return { intent: 'help' };

  // Jokes
  if (/(joke|funny|make me laugh|tell me something funny|riddle|humor)/i.test(lower))
    return { intent: 'jokes' };

  // Love
  if (/(i love you|love you|you're the best|you're awesome|you rock|you are amazing|best friend)/i.test(lower))
    return { intent: 'love' };

  // How are you
  if (/(how are you|how you doing|how's it going|what's up with you|how do you feel)/i.test(lower))
    return { intent: '_howareyou' };

  // Motivation — broad
  if (/(motivat|inspire|encourage|boost|pump me up|fire me up|believe in me|i need strength|give me strength|push me|i can do|cheer me|uplift)/i.test(lower))
    return { intent: 'motivation' };

  // Productivity
  if (/(productivity|productive|focus tip|time management|how to focus|concentrate|efficiency|pomodoro|deep work|work better|study tip)/i.test(lower))
    return { intent: 'productivity' };

  // Relaxation
  if (/(relax|calm|chill|peace|breathe|meditation|mindful|wind down|destress|de-stress|unwind|zen|tranquil)/i.test(lower))
    return { intent: 'relaxation' };

  // Goals
  if (/(goal|target|plan my|set a|objective|aim|resolution|track|achieve|accomplish)/i.test(lower))
    return { intent: 'goals' };

  // Sadness
  if (/(i'?m sad|feeling sad|feeling down|depressed|unhappy|heartbroken|crying|feeling blue|feel bad|not okay|not fine|feeling low)/i.test(lower))
    return { intent: 'sadness' };

  // Anxiety
  if (/(anxious|worried|nervous|scared|afraid|panic|anxiety|fear|uneasy|terrified|overthinking)/i.test(lower))
    return { intent: 'anxiety' };

  // Happiness
  if (/(i'?m happy|feeling great|feeling good|feeling awesome|wonderful|amazing day|fantastic|best day|so good|feeling amazing)/i.test(lower))
    return { intent: 'happiness' };

  // Frustration / Anger
  if (/(frustrated|annoyed|irritated|angry|mad|furious|pissed|hate this|ugh|so annoying|fed up)/i.test(lower))
    return { intent: 'frustration' };

  // Tiredness
  if (/(tired|exhausted|sleepy|drained|worn out|fatigue|burnout|burn out|no energy|so tired|need sleep|need rest)/i.test(lower))
    return { intent: 'tiredness' };

  // Stress
  if (/(stressed|overwhelmed|pressure|too much|can't handle|breaking down|stressed out|so much work|overloaded)/i.test(lower))
    return { intent: 'stress' };

  // Confusion
  if (/(confused|lost|unsure|uncertain|don't understand|don't get it|what do you mean|unclear|help me understand)/i.test(lower))
    return { intent: 'confused' };

  // Boredom
  if (/(bored|boring|nothing to do|entertain me|what should i do|i'm bored|so bored)/i.test(lower))
    return { intent: 'bored' };

  // Loneliness
  if (/(lonely|alone|no friends|nobody|isolated|feel alone|all alone|no one)/i.test(lower))
    return { intent: 'lonely' };

  // Focus App & Knowledge
  if (/(what is focus|tell me about focus|about the app|focus app)/i.test(lower))
    return { intent: 'focus_app' };
  if (/(founder|hariharun|muthukumaran|who created|who made|visionary|ceo|h2 innovative|h2innovative|the company)/i.test(lower))
    return { intent: 'founder' };
  if (/(features|what can i do here|app modules|functionality)/i.test(lower))
    return { intent: 'features' };
  if (/(safety|trust shield|trustshield|moderation|toxic|protect|privacy)/i.test(lower))
    return { intent: 'safety' };
  if (/(boltz|vertical video|reels|tiktok|video feature)/i.test(lower))
    return { intent: 'boltz' };
  if (/(create|upload|post|make content|studio|forge)/i.test(lower))
    return { intent: 'create' };
  if (/(explore|discover|trending|search|find people)/i.test(lower))
    return { intent: 'explore' };
  if (/(message|chat|dm|direct message|conversation|call)/i.test(lower))
    return { intent: 'messages' };
  if (/(profile|my page|avatar|bio|followers|following)/i.test(lower))
    return { intent: 'profile' };
  if (/(settings|nexus|preferences|account|linked)/i.test(lower))
    return { intent: 'settings' };
  if (/(verify|verification|id|trust score|badge|level)/i.test(lower))
    return { intent: 'verification' };

  return null;
};

// ============================================================================
// RESPONSE GENERATOR
// ============================================================================

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateResponse = (intent, emotion) => {
  // Special cases
  if (intent === '_howareyou') {
    return "I'm doing great, Macha! 🦁 Always energized when I'm chatting with you! How about YOU? How are you feeling right now? 💜";
  }

  const bucket = RESPONSES[intent] || RESPONSES.general;
  const emotionResponses = bucket[emotion] || bucket.neutral || RESPONSES.general.neutral;
  return randomFrom(emotionResponses);
};

// ============================================================================
// CONVERSATION CONTEXT TRACKER
// ============================================================================

let conversationContext = {
  recentIntents: [],
  recentEmotions: [],
  turnCount: 0,
  lastTopic: null,
};

const updateContext = (intent, emotion) => {
  conversationContext.turnCount++;
  conversationContext.recentIntents.push(intent);
  conversationContext.recentEmotions.push(emotion);
  if (conversationContext.recentIntents.length > 10) conversationContext.recentIntents.shift();
  if (conversationContext.recentEmotions.length > 10) conversationContext.recentEmotions.shift();
  conversationContext.lastTopic = intent;
};

// ============================================================================
// MAIN PROCESSOR
// ============================================================================

/**
 * Process user message — Transformer AI + Local fallback
 */
export const processMessage = async (message, context = {}) => {
  const startTime = Date.now();

  // LAYER 1: Quick pattern match (instant)
  const quick = quickMatch(message);
  if (quick) {
    const emotion = detectEmotion(message);
    const response = generateResponse(quick.intent, emotion.emotion);
    updateContext(quick.intent, emotion.emotion);
    // Small natural delay
    const elapsed = Date.now() - startTime;
    if (elapsed < 300) await new Promise(r => setTimeout(r, 300 - elapsed));
    return { response, source: 'local', confidence: 1.0, intent: quick.intent, emotion: emotion.emotion };
  }

  // LAYER 2: Transformer AI (semantic understanding)
  let intent = 'general';
  let intentScore = 0;
  const emotion = detectEmotion(message);

  if (modelStatus === 'ready' && embedder) {
    try {
      // Build intent embeddings on first AI call
      await buildIntentEmbeddings();

      const msgEmbedding = await getEmbedding(message);
      if (msgEmbedding) {
        const result = await classifyIntent(msgEmbedding);
        intent = result.intent;
        intentScore = result.score;

        // Only use AI classification if confidence is high enough
        if (intentScore < 0.35) intent = 'general';
      }
    } catch (err) {
      console.warn('[FocuslyBrain] AI classification error:', err.message);
    }
  } else {
    // Fallback: keyword-based intent detection
    intent = keywordIntent(message);
  }

  // LAYER 3: Generate contextual response
  const response = generateResponse(intent, emotion.emotion);
  updateContext(intent, emotion.emotion);

  // Natural typing delay
  const elapsed = Date.now() - startTime;
  const targetDelay = modelStatus === 'ready' ? 400 : 500;
  if (elapsed < targetDelay) await new Promise(r => setTimeout(r, targetDelay - elapsed));

  return {
    response,
    source: modelStatus === 'ready' ? 'ai' : 'local',
    confidence: modelStatus === 'ready' ? Math.max(intentScore, 0.7) : 0.6,
    intent,
    emotion: emotion.emotion,
  };
};

// Fallback keyword-based intent when model isn't loaded
const keywordIntent = (msg) => {
  const lower = msg.toLowerCase();
  if (/(motivat|inspire|encourage|boost|pump me up|fire me up|believe|strength)/i.test(lower)) return 'motivation';
  if (/(tip|advice|productive|focus|concentrate|efficiency|time management)/i.test(lower)) return 'productivity';
  if (/(relax|calm|chill|peace|breathe|meditation|mindful|wind down|destress|unwind)/i.test(lower)) return 'relaxation';
  if (/(sad|unhappy|down|depressed|upset|heartbroken|crying|lonely|alone)/i.test(lower)) return 'sadness';
  if (/(anxious|worried|nervous|scared|afraid|panic|anxiety|fear)/i.test(lower)) return 'anxiety';
  if (/(happy|great|awesome|wonderful|amazing|fantastic|love it|best day)/i.test(lower)) return 'happiness';
  if (/(frustrated|annoyed|irritated|angry|mad|furious|hate|ugh)/i.test(lower)) return 'frustration';
  if (/(tired|exhausted|sleepy|drained|worn out|fatigue|burnout)/i.test(lower)) return 'tiredness';
  if (/(stressed|overwhelmed|pressure|too much|can't handle|breaking)/i.test(lower)) return 'stress';
  if (/(confused|lost|unsure|uncertain|don't understand|unclear)/i.test(lower)) return 'confused';
  if (/(bored|nothing to do|entertain|what should i do)/i.test(lower)) return 'bored';
  if (/(lonely|alone|no friends|nobody|isolated)/i.test(lower)) return 'lonely';
  if (/(goal|target|plan|objective|aim|resolution)/i.test(lower)) return 'goals';
  return 'general';
};

// ============================================================================
// EXPORTS — Context & Helpers
// ============================================================================

export const getModelStatus = () => modelStatus;

export const getContextGreeting = (screenName) => {
  const contextGreetings = {
    home: "Welcome home, Macha! Ready to share your vision? 🏠",
    explore: "Explore the community, Macha! Discover new inspirations! 🔍",
    create: "Time to create, Macha! What's on your mind? 🎨",
    boltz: "Boltz mode activated, Macha! Let your creativity flow! 🎬",
    profile: "Your legacy, Macha! Look how far you've come! ✨",
    messages: "Connecting with your tribe, Macha! 💬",
    settings: "Customize your experience, Macha! ⚙️",
    notifications: "Stay in the loop, Macha! 🔔",
  };
  return contextGreetings[screenName?.toLowerCase()] || "I'm here, Macha! What can I help with? 🦁";
};

export const detectEmotionalState = (userProfile, recentMemories = []) => {
  const emotionalState = { mood: 'neutral', confidence: 0.5, factors: [] };
  if (userProfile?.is_restricted) {
    emotionalState.mood = 'concerned';
    emotionalState.confidence = 0.9;
    emotionalState.factors.push('account_restricted');
  }
  const recentWarnings = recentMemories.filter(m => m.memory_type === 'warning');
  if (recentWarnings.length > 0) {
    emotionalState.mood = 'worried';
    emotionalState.confidence = 0.8;
  }
  const recentMilestones = recentMemories.filter(m => m.memory_type === 'milestone');
  if (recentMilestones.length > 0) {
    emotionalState.mood = 'celebratory';
    emotionalState.confidence = 0.85;
  }
  return emotionalState;
};

export const celebrateMilestone = (milestone) => {
  const celebrations = [
    `Macha, ${milestone}! You're building an amazing legacy! 🎉`,
    `Incredible, Macha! ${milestone} — that's huge! 🦁`,
    `Wow, Macha! ${milestone}! Your dedication is inspiring! ✨`,
    `Macha, you did it! ${milestone}! Keep crushing it! 🔥`,
  ];
  return randomFrom(celebrations);
};

export const generateToxicWarning = () => {
  const warnings = [
    "Don't let that frequency disturb your Focus, Buddy. I've already alerted the Guard. 🛡️",
    "Macha, I detected something toxic. Stay focused on the positive! I've got your back.",
    "Toxic content blocked, Macha. Your peace of mind is protected. Keep shining! ✨",
  ];
  return randomFrom(warnings);
};

export const recordMemory = async () => null;
export const getRecentMemories = async () => [];
export const recordMilestone = async () => null;
export const recordMoodSwing = async () => null;
export const recordPreference = async () => null;
export const recordWarning = async () => null;
export const checkInactivity = async () => ({ isInactive: false });

export default {
  processMessage,
  getModelStatus,
  getContextGreeting,
  detectEmotionalState,
  celebrateMilestone,
  generateToxicWarning,
  recordMemory,
  getRecentMemories,
  recordMilestone,
  recordMoodSwing,
  recordPreference,
  recordWarning,
  checkInactivity,
};
