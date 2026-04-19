/**
 * sentimentFirewall.js
 * ====================
 * The Wise King's Algorithm — Gemini-powered sentiment analysis
 * via Supabase Edge Function (server-side, bypass-proof)
 *
 * Detects: hatred, propaganda, negative thought loops, toxic energy
 *
 * H2 Innovative — Cultural Firewall
 */

import { supabase } from '../lib/supabase';

// ── Local pre-scan (instant, before edge function) ───────────────────────────
// Catches obvious violations without an API call
const INSTANT_BLOCK_PATTERNS = [
  // Self-harm (critical)
  { pattern: /\b(kill\s*(your)?self|suicide|end\s*my\s*life|want\s*to\s*die)\b/i, type: 'self_harm', severity: 'critical' },
  // Extreme hate (critical)
  { pattern: /\b(die\s*(all|you)|exterminate|genocide|ethnic\s*cleansing)\b/i, type: 'hate_speech', severity: 'critical' },
  // Slurs (placeholder — replace with actual list in production)
  { pattern: /\b(slur1|slur2)\b/i, type: 'hate_speech', severity: 'high' },
];

const TOXIC_PATTERNS = [
  { pattern: /\b(you[\s']*re\s*(stupid|idiot|dumb|worthless|ugly|loser))\b/i, type: 'personal_attack', severity: 'medium' },
  { pattern: /\b(fake news|propaganda|sheep|brainwashed|wake\s*up)\b/i, type: 'propaganda', severity: 'low' },
  { pattern: /(hate\s+(you|this|them|all|every(one|body)))/i, type: 'hate_speech', severity: 'medium' },
];

/**
 * Local instant scan — zero latency
 * Catches obviously toxic content before Gemini call
 */
export const instantScan = (text) => {
  if (!text || typeof text !== 'string') {
    return { isToxic: false, confidence: 0 };
  }

  // Check instant blocks first
  for (const { pattern, type, severity } of INSTANT_BLOCK_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isToxic: true,
        toxicityType: type,
        severity,
        confidence: 0.95,
        explanation: getLocalExplanation(type),
        source: 'instant_scan',
      };
    }
  }

  // Check toxic patterns
  const matches = TOXIC_PATTERNS.filter(({ pattern }) => pattern.test(text));
  if (matches.length > 0) {
    const worst = matches.sort((a, b) =>
      severityScore(b.severity) - severityScore(a.severity)
    )[0];
    return {
      isToxic: matches.length >= 2 || worst.severity === 'high',
      toxicityType: worst.type,
      severity: worst.severity,
      confidence: 0.75,
      explanation: getLocalExplanation(worst.type),
      source: 'pattern_scan',
    };
  }

  return { isToxic: false, confidence: 0 };
};

const severityScore = (s) => ({ critical: 4, high: 3, medium: 2, low: 1 }[s] || 0);

const getLocalExplanation = (type) => {
  const explanations = {
    hate_speech: 'This content contains language that promotes hatred or discrimination. Focus is built on respect — every citizen deserves dignity.',
    self_harm: 'We detected content that may relate to self-harm. At Focus, your wellbeing comes first. If you\'re struggling, Focusly is here to listen.',
    propaganda: 'This content appears to spread misleading information. Focus values truth and constructive dialogue.',
    personal_attack: 'This message contains personal attacks. Focus citizens build each other up, not tear them down.',
    violence: 'This content depicts or promotes violence. Focus is a safe space for everyone.',
  };
  return explanations[type] || 'This content violates the Focus Community Constitution.';
};

/**
 * Deep Gemini scan via Supabase Edge Function (server-side)
 * @param {string} text
 * @param {string[]} [imageUrls]
 * @returns {Object} { isToxic, toxicityType, severity, confidence, explanation }
 */
export const deepScan = async (text, imageUrls = []) => {
  try {
    const { data, error } = await supabase.functions.invoke('content-moderator', {
      body: {
        action: 'analyze_sentiment',
        text: text?.slice(0, 2000), // Limit to 2000 chars
        imageUrls: imageUrls.slice(0, 5),
      },
    });

    if (error) {
      // Edge function unavailable — fall back to local scan only
      console.warn('[SentimentFirewall] Edge function unavailable, using local scan');
      return instantScan(text);
    }

    return {
      isToxic: data.isToxic || false,
      toxicityType: data.toxicityType || 'unknown',
      severity: data.severity || 'low',
      confidence: data.confidence || 0,
      explanation: data.explanation || 'Content violates Focus Community Constitution.',
      categories: data.categories || [],
      source: 'gemini_edge',
    };
  } catch (err) {
    console.warn('[SentimentFirewall] Falling back to local scan:', err.message);
    return instantScan(text);
  }
};

/**
 * Full Content Wall — runs BOTH instant + deep scan
 * Returns final verdict
 * @param {Object} content - { text, imageUrls, contentType }
 */
export const runContentWall = async (content) => {
  const { text = '', imageUrls = [] } = content;

  // Step 1: Instant local scan (0ms)
  const localResult = instantScan(text);
  if (localResult.isToxic && localResult.confidence >= 0.9) {
    // Critical violation — block immediately, no API call needed
    return {
      ...localResult,
      blocked: true,
      requiresStrike: true,
    };
  }

  // Step 2: nsfwjs image scan (local, already imported in contentScanner.js)
  // [handled externally — passed in with imageFlags]

  // Step 3: Gemini deep scan via Edge Function
  const deepResult = await deepScan(text, imageUrls);

  return {
    ...deepResult,
    blocked: deepResult.isToxic && deepResult.confidence >= 0.6,
    requiresStrike: deepResult.isToxic && deepResult.confidence >= 0.7,
  };
};

const _defaultModule = { instantScan, deepScan, runContentWall };


export default _defaultModule;
