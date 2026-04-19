/**
 * reportTriageEngine.js
 * =====================
 * Auto-categorizes incoming support reports into 4 pillars:
 *   Identity Fraud → Trust Shield re-verification
 *   Toxic Content  → Content Moderation review
 *   Bugs           → Engineering team
 *   Loneliness     → Focusly AI + Human support
 *
 * H2 Innovative — Pillar 5: The Founder's Hotline
 */

// ── Triage Categories ─────────────────────────────────────────────────────────
const TRIAGE_RULES = [
  {
    category: 'identity_fraud',
    priority: 'CRITICAL',
    label: 'Identity Fraud',
    icon: '🛡️',
    keywords: [
      /\b(fake|impersonation|catfish|stolen identity|fake account|pretending to be|not who they say)\b/i,
      /\b(scam|phishing|account hacked|someone else|my photos)\b/i,
    ],
    suggestedAction: 'Flag reported account for Trust Shield re-verification. Soft-lock posting.',
    requiresHuman: true,
    requiresTrustShield: true,
  },
  {
    category: 'toxic_content',
    priority: 'HIGH',
    label: 'Toxic Content',
    icon: '🔥',
    keywords: [
      /\b(harassment|bullying|hate speech|threatening|abusive|racist|sexist|slur|violent)\b/i,
      /\b(inappropriate|offensive|disgusting|vile|report this|shouldn't be allowed)\b/i,
    ],
    suggestedAction: 'Auto-flag content for moderation review. Initiate strike assessment.',
    requiresHuman: false,
  },
  {
    category: 'distress',
    priority: 'CRITICAL',
    label: 'User Distress',
    icon: '💜',
    keywords: [
      /\b(suicidal|self harm|hopeless|want to die|hurting myself|crisis|emergency)\b/i,
      /\b(help me|desperate|nobody cares|alone|depressed|can't cope)\b/i,
    ],
    suggestedAction: 'Activate Focusly guardian_mode. Show crisis resources. Escalate to human within 5 minutes.',
    requiresHuman: true,
    requiresDistressProtocol: true,
  },
  {
    category: 'bugs',
    priority: 'MEDIUM',
    label: 'Bug / Technical Issue',
    icon: '🐛',
    keywords: [
      /\b(bug|crash|error|broken|not working|can't|doesn't work|glitch|frozen|loading|slow)\b/i,
      /\b(blank screen|won't load|failed|oops|something went wrong)\b/i,
    ],
    suggestedAction: 'Log to engineering queue. Send automated troubleshooting guide.',
    requiresHuman: false,
  },
  {
    category: 'loneliness',
    priority: 'HIGH',
    label: 'Loneliness / Mental Health',
    icon: '🌱',
    keywords: [
      /\b(lonely|alone|no friends|isolated|nobody talks to me|feel invisible|left out|excluded)\b/i,
      /\b(sad|depressed|unhappy|anxious|stressed|struggling|overwhelmed)\b/i,
    ],
    suggestedAction: 'Activate Focusly AI empathy mode. Suggest community features. Monitor for escalation.',
    requiresHuman: false,
    requiresEmpathy: true,
  },
];

/**
 * Auto-triage a report or message
 * @param {string} text - Report text / user message
 * @returns {Object} Triage result
 */
export const triageReport = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      category: 'general',
      priority: 'LOW',
      label: 'General Inquiry',
      icon: '📋',
      suggestedAction: 'Route to support queue for human review.',
      requiresHuman: true,
      confidence: 0,
    };
  }

  const matches = [];

  for (const rule of TRIAGE_RULES) {
    let matchCount = 0;
    const matchedKeywords = [];

    for (const pattern of rule.keywords) {
      const match = text.match(pattern);
      if (match) {
        matchCount++;
        matchedKeywords.push(match[0]);
      }
    }

    if (matchCount > 0) {
      matches.push({
        ...rule,
        matchCount,
        matchedKeywords,
        confidence: Math.min(0.5 + matchCount * 0.25, 0.99),
      });
    }
  }

  if (matches.length === 0) {
    return {
      category: 'general',
      priority: 'LOW',
      label: 'General Inquiry',
      icon: '📋',
      suggestedAction: 'Route to support queue for human review.',
      requiresHuman: true,
      confidence: 0.3,
    };
  }

  // Sort by priority then match count
  const priorityScore = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  matches.sort((a, b) => {
    const pDiff = priorityScore[b.priority] - priorityScore[a.priority];
    return pDiff !== 0 ? pDiff : b.matchCount - a.matchCount;
  });

  const best = matches[0];
  return {
    category: best.category,
    priority: best.priority,
    label: best.label,
    icon: best.icon,
    confidence: best.confidence,
    matchedKeywords: best.matchedKeywords,
    suggestedAction: best.suggestedAction,
    requiresHuman: best.requiresHuman || false,
    requiresTrustShield: best.requiresTrustShield || false,
    requiresDistressProtocol: best.requiresDistressProtocol || false,
    requiresEmpathy: best.requiresEmpathy || false,
    allMatches: matches.map(m => m.category),
  };
};

/**
 * Insert triaged report into Supabase support_escalations
 */
export const submitTriagedReport = async (supabase, userId, reportText, additionalData = {}) => {
  const triage = triageReport(reportText);

  const { data, error } = await supabase
    .from('support_escalations')
    .insert({
      user_id: userId,
      escalation_type: triage.category,
      priority: triage.priority,
      status: 'OPEN',
      triage_result: {
        ...triage,
        reportText: reportText.slice(0, 1000),
        ...additionalData,
      },
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, triage };
};

const _defaultModule = { triageReport, submitTriagedReport };


export default _defaultModule;
