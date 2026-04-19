/**
 * useDistressDetection.js
 * =======================
 * Monitors user messages and reports for crisis signals
 * On detection: Focusly appears in guardian_mode + crisis resources shown
 * Escalates to human support within 5-minute SLA
 *
 * H2 Innovative — Pillar 5: Safety Net
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// ── Crisis Keyword Tiers ──────────────────────────────────────────────────────
const CRISIS_KEYWORDS = {
  critical: [
    /\b(want to die|kill myself|end my life|suicide|suicidal|don't want to live|ending it all|can't go on|no point living)\b/i,
    /\b(hurt myself|self harm|cut myself|harm myself)\b/i,
    /\b(nobody cares if i die|better off dead|world without me)\b/i,
  ],
  high: [
    /\b(hopeless|no hope|life is pointless|nothing matters|give up on life)\b/i,
    /\b(nobody cares|no one would notice|completely alone|totally alone)\b/i,
    /\b(can't take it anymore|can't handle this|too much pain)\b/i,
  ],
  medium: [
    /\b(feeling worthless|feel like a burden|hate myself)\b/i,
    /\b(trapped|no way out|stuck forever)\b/i,
    /\b(crying all the time|can't stop crying|sobbing)\b/i,
  ],
};

// ── Crisis helpline numbers (India-centric, configurable) ─────────────────────
export const CRISIS_HELPLINES = [
  { name: 'iCall', number: '9152987821', available: 'Mon–Sat, 8am–10pm', flag: '🇮🇳' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', available: '24/7', flag: '🇮🇳' },
  { name: 'SNEHI', number: '044-24640050', available: '24/7', flag: '🇮🇳' },
  { name: 'iCall Chat', url: 'https://icallhelpline.org', available: '24/7', flag: '🌐' },
];

/**
 * Analyze text for crisis signals
 * @param {string} text
 * @returns {{ isDistress: boolean, tier: string, signals: string[], confidence: number }}
 */
export const analyzeForDistress = (text) => {
  if (!text || typeof text !== 'string') {
    return { isDistress: false, tier: null, signals: [], confidence: 0 };
  }

  const signals = [];
  let tier = null;

  // Check critical first
  for (const pattern of CRISIS_KEYWORDS.critical) {
    const match = text.match(pattern);
    if (match) {
      signals.push(match[0]);
      tier = 'critical';
    }
  }

  if (!tier) {
    for (const pattern of CRISIS_KEYWORDS.high) {
      const match = text.match(pattern);
      if (match) {
        signals.push(match[0]);
        if (!tier) tier = 'high';
      }
    }
  }

  if (!tier) {
    for (const pattern of CRISIS_KEYWORDS.medium) {
      const match = text.match(pattern);
      if (match) {
        signals.push(match[0]);
        if (!tier) tier = 'medium';
      }
    }
  }

  const isDistress = signals.length > 0;
  const confidence = isDistress
    ? Math.min(0.6 + signals.length * 0.15, 0.99)
    : 0;

  return { isDistress, tier, signals, confidence };
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useDistressDetection = () => {
  const { user } = useAuth();
  const [distressState, setDistressState] = useState(null); // null | { tier, signals, timestamp }
  const [showCrisisUI, setShowCrisisUI] = useState(false);

  /**
   * Check a message for distress signals
   * Call this whenever user sends a message or writes a post
   * @param {string} text
   * @returns {Object} analysis result
   */
  const checkForDistress = useCallback(async (text) => {
    const analysis = analyzeForDistress(text);

    if (!analysis.isDistress) return analysis;

    const state = {
      ...analysis,
      timestamp: new Date().toISOString(),
    };

    setDistressState(state);

    // Show crisis UI for critical and high
    if (analysis.tier === 'critical' || analysis.tier === 'high') {
      setShowCrisisUI(true);

      // Create escalation record for human follow-up
      if (user?.id) {
        await createEscalation(state);
      }
    }

    return analysis;
  }, [user?.id]);

  /**
   * Create a support escalation in the database
   */
  const createEscalation = async (state) => {
    try {
      await supabase.from('support_escalations').insert({
        user_id: user.id,
        escalation_type: 'distress',
        priority: state.tier === 'critical' ? 'CRITICAL' : 'HIGH',
        status: 'OPEN',
        distress_signals: state.signals,
        triage_result: {
          tier: state.tier,
          confidence: state.confidence,
          timestamp: state.timestamp,
        },
      });
    } catch (err) {
      console.error('[DistressDetection] Escalation error:', err.message);
    }
  };

  /**
   * Dismiss crisis UI (user says they're okay)
   */
  const dismissCrisisUI = useCallback(() => {
    setShowCrisisUI(false);
    setDistressState(null);
  }, []);

  return {
    distressState,
    showCrisisUI,
    checkForDistress,
    dismissCrisisUI,
    analyzeForDistress,
    CRISIS_HELPLINES,
  };
};

export default useDistressDetection;
