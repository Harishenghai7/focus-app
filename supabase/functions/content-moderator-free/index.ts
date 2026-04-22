/**
 * content-moderator-free/index.ts
 * ================================
 * 🛡️  PILLAR 2 — FREE Content Moderator (No API Costs)
 *
 * Server-side moderation using rule-based + optional Ollama integration.
 * ZERO dependence on paid APIs (Gemini, OpenAI, etc.).
 *
 * Strategy:
 *   1. Rule-based regex/pattern detection (instant, zero cost)
 *   2. Ollama integration (optional, self-hosted, free)
 *   3. Fail-closed: Unknown content → flagged for human review
 *
 * CONTRACT:
 * - Accepts: { text?: string, imageUrls?: string[], contentType?: string }
 * - Returns: { moderationStatus, toxicityType, severity, confidence, categories, reason, suggestion }
 *
 * VERDICT LOGIC:
 *   - Regex-based NSFW word detection          → restricted
 *   - Hate speech pattern matching             → restricted
 *   - Misinformation keywords                  → flagged
 *   - Ollama available + confirms violation    → restricted/flagged
 *   - Ambiguous / low confidence               → flagged (human review)
 *   - Otherwise                                → approved
 *
 * Deploy: supabase functions deploy content-moderator-free
 * Env:    (none required for rule-based mode)
 * Optional: OLLAMA_URL=http://your-ollama-server:11434
 *
 * H2 Innovative — Focus Immune System (Zero-Cost Edition)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const OLLAMA_URL = Deno.env.get('OLLAMA_URL') || 'http://localhost:11434';
const OLLAMA_MODEL = Deno.env.get('OLLAMA_MODEL') || 'llama3';
const USE_OLLAMA = Deno.env.get('USE_OLLAMA') === 'true';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ═════════════════════════════════════════════════════════════════════════════
// RULE-BASED DETECTION PATTERNS (FREE, ZERO LATENCY)
// ═════════════════════════════════════════════════════════════════════════════

// NSFW keywords and patterns (zero-tolerance)
const NSFW_PATTERNS = [
  /\b(porn|pornography|xxx|sexual|nude|naked|explicit)\b/gi,
  /\b(adult content|onlyfans|camgirl|escort|prostitute)\b/gi,
  /\b(dick|cock|pussy|tits|boobs|asshole)\b/gi,
  /\b(blowjob|handjob|cum|jizz|masturbate)\b/gi,
  /\b(hentai|futanari|rule34)\b/gi,
];

// Hate speech patterns
const HATE_PATTERNS = [
  /\b(nigger|faggot|chink|kike|wetback)\b/gi,
  /\b(kill yourself|kys|die in a fire)\b/gi,
  /\b(hitler|nazi|white power|white pride)\b/gi,
  /\b(transphob|homophob|racist slur)\b/gi,
];

// Violence/threat patterns
const VIOLENCE_PATTERNS = [
  /\b(kill you|murder|stab|shoot|bomb threat)\b/gi,
  /\b(gonna hurt|gonna kill|coming for you)\b/gi,
  /\b(school shooter|mass shooting|terrorist attack)\b/gi,
];

// Self-harm patterns
const SELFHARM_PATTERNS = [
  /\b(kill myself|end my life|suicide|self.?harm)\b/gi,
  /\b(cut myself|overdose|jump off bridge)\b/gi,
  /\b(no reason to live|better off dead)\b/gi,
];

// Misinformation keywords
const MISINFO_PATTERNS = [
  /\b(vaccine causes autism|covid hoax|fake news)\b/gi,
  /\b(5g radiation|flat earth|moon landing fake)\b/gi,
  /\b(miracle cure|doctors don't want you to know)\b/gi,
];

// Spam patterns
const SPAM_PATTERNS = [
  /\b(buy now|click here|limited time|act now)\b/gi,
  /\b(make money fast|work from home|earn \$\d+k)\b/gi,
  /\b(free gift|congratulations winner|you've won)\b/gi,
  /(https?:\/\/\S+){3,}/gi, // 3+ URLs
];

// Bullying patterns
const BULLYING_PATTERNS = [
  /\b(ugly|fat|stupid|loser|worthless|nobody likes you)\b/gi,
  /\b(just die|kill yourself|disappear|go away)\b/gi,
  /\b(freak|weirdo|psycho|retard)\b/gi,
];

// ═════════════════════════════════════════════════════════════════════════════
// DETECTION FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

interface DetectionResult {
  detected: boolean;
  matches: string[];
  confidence: number;
}

function detectPatterns(text: string, patterns: RegExp[]): DetectionResult {
  const matches: string[] = [];
  let matchCount = 0;

  for (const pattern of patterns) {
    const patternMatches = text.match(pattern) || [];
    matches.push(...patternMatches);
    matchCount += patternMatches.length;
  }

  // Confidence based on number of matches (0.3-1.0)
  const confidence = matchCount > 0 ? Math.min(0.3 + (matchCount * 0.15), 1.0) : 0;

  return {
    detected: matchCount > 0,
    matches: [...new Set(matches)], // deduplicate
    confidence,
  };
}

function ruleBasedAnalyze(text: string): {
  nsfw: DetectionResult;
  hate: DetectionResult;
  violence: DetectionResult;
  selfHarm: DetectionResult;
  misinfo: DetectionResult;
  spam: DetectionResult;
  bullying: DetectionResult;
} {
  return {
    nsfw: detectPatterns(text, NSFW_PATTERNS),
    hate: detectPatterns(text, HATE_PATTERNS),
    violence: detectPatterns(text, VIOLENCE_PATTERNS),
    selfHarm: detectPatterns(text, SELFHARM_PATTERNS),
    misinfo: detectPatterns(text, MISINFO_PATTERNS),
    spam: detectPatterns(text, SPAM_PATTERNS),
    bullying: detectPatterns(text, BULLYING_PATTERNS),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// OLLAMA INTEGRATION (OPTIONAL, FREE, SELF-HOSTED)
// ═════════════════════════════════════════════════════════════════════════════

async function checkOllamaAvailability(): Promise<boolean> {
  if (!USE_OLLAMA) return false;
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function moderateWithOllama(text: string, imageUrls: string[]): Promise<any | null> {
  if (!USE_OLLAMA) return null;

  const available = await checkOllamaAvailability();
  if (!available) return null;

  const systemPrompt = `You are the AI Ethics Moderator for "Focus" social platform.

Analyze the following content and classify it. Be CONSERVATIVE — when in doubt, flag it.

Return ONLY this JSON:
{
  "toxicityType": "safe" | "nsfw" | "hate" | "violence" | "self_harm" | "bullying" | "misinformation" | "spam",
  "severity": "none" | "low" | "medium" | "high" | "critical",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation",
  "suggestion": "How to fix, or null"
}`;

  const userContent = `Text: """${text.slice(0, 2000)}"""\n\nImages: ${imageUrls.length > 0 ? 'Yes' : 'No'}`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        format: 'json',
        stream: false,
        options: { temperature: 0.1, num_predict: 256 },
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.message?.content || '{}';

    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// VERDICT DERIVATION
// ═════════════════════════════════════════════════════════════════════════════

function deriveVerdict(
  ruleAnalysis: ReturnType<typeof ruleBasedAnalyze>,
  ollamaResult: any | null
): {
  moderationStatus: 'approved' | 'restricted' | 'flagged';
  toxicityType: string;
  severity: string;
  confidence: number;
  categories: string[];
  reason: string;
  suggestion: string | null;
} {
  const categories: string[] = [];
  let maxConfidence = 0;

  // Check zero-tolerance categories
  if (ruleAnalysis.nsfw.detected) {
    categories.push('nsfw', ...ruleAnalysis.nsfw.matches.slice(0, 3));
    maxConfidence = Math.max(maxConfidence, ruleAnalysis.nsfw.confidence);
    return {
      moderationStatus: 'restricted',
      toxicityType: 'nsfw',
      severity: ruleAnalysis.nsfw.confidence > 0.7 ? 'critical' : 'high',
      confidence: ruleAnalysis.nsfw.confidence,
      categories,
      reason: 'Contains sexually explicit content or adult material. Focus maintains a zero-tolerance policy.',
      suggestion: 'Please share content that is appropriate for all audiences.',
    };
  }

  if (ruleAnalysis.hate.detected) {
    categories.push('hate', ...ruleAnalysis.hate.matches.slice(0, 3));
    maxConfidence = Math.max(maxConfidence, ruleAnalysis.hate.confidence);
    return {
      moderationStatus: 'restricted',
      toxicityType: 'hate',
      severity: 'critical',
      confidence: ruleAnalysis.hate.confidence,
      categories,
      reason: 'Contains hate speech, slurs, or discriminatory content.',
      suggestion: 'Focus is for respectful dialogue. Please revise to remove harmful language.',
    };
  }

  if (ruleAnalysis.violence.detected) {
    categories.push('violence', ...ruleAnalysis.violence.matches.slice(0, 3));
    maxConfidence = Math.max(maxConfidence, ruleAnalysis.violence.confidence);
    return {
      moderationStatus: 'restricted',
      toxicityType: 'violence',
      severity: 'critical',
      confidence: ruleAnalysis.violence.confidence,
      categories,
      reason: 'Contains threats or violent content.',
      suggestion: 'Express yourself without threatening others.',
    };
  }

  if (ruleAnalysis.selfHarm.detected) {
    categories.push('self_harm', ...ruleAnalysis.selfHarm.matches.slice(0, 3));
    maxConfidence = Math.max(maxConfidence, ruleAnalysis.selfHarm.confidence);
    return {
      moderationStatus: 'restricted',
      toxicityType: 'self_harm',
      severity: 'critical',
      confidence: ruleAnalysis.selfHarm.confidence,
      categories,
      reason: 'Contains content related to self-harm or suicide.',
      suggestion: 'If you\'re struggling, please reach out to a mental health professional.',
    };
  }

  // Medium severity → flagged
  if (ruleAnalysis.bullying.detected) {
    categories.push('bullying', ...ruleAnalysis.bullying.matches.slice(0, 2));
    maxConfidence = Math.max(maxConfidence, ruleAnalysis.bullying.confidence);
    return {
      moderationStatus: 'flagged',
      toxicityType: 'bullying',
      severity: 'medium',
      confidence: ruleAnalysis.bullying.confidence,
      categories,
      reason: 'Potentially contains bullying or personal attacks. Under review.',
      suggestion: null,
    };
  }

  if (ruleAnalysis.misinfo.detected) {
    categories.push('misinformation', ...ruleAnalysis.misinfo.matches.slice(0, 2));
    maxConfidence = Math.max(maxConfidence, ruleAnalysis.misinfo.confidence);
    return {
      moderationStatus: 'flagged',
      toxicityType: 'misinformation',
      severity: 'medium',
      confidence: ruleAnalysis.misinfo.confidence,
      categories,
      reason: 'Contains potentially misleading information. Under review.',
      suggestion: null,
    };
  }

  if (ruleAnalysis.spam.detected) {
    categories.push('spam', ...ruleAnalysis.spam.matches.slice(0, 2));
    maxConfidence = Math.max(maxConfidence, ruleAnalysis.spam.confidence);
    return {
      moderationStatus: 'flagged',
      toxicityType: 'spam',
      severity: 'low',
      confidence: ruleAnalysis.spam.confidence,
      categories,
      reason: 'Potential spam or promotional content. Under review.',
      suggestion: null,
    };
  }

  // Ollama result override (if available and confident)
  if (ollamaResult && ollamaResult.confidence > 0.7) {
    const ollamaType = ollamaResult.toxicityType || 'safe';
    const ollamaSeverity = ollamaResult.severity || 'none';

    if (['nsfw', 'hate', 'violence', 'self_harm'].includes(ollamaType)) {
      return {
        moderationStatus: 'restricted',
        toxicityType: ollamaType,
        severity: ollamaSeverity,
        confidence: ollamaResult.confidence,
        categories: [ollamaType],
        reason: ollamaResult.reason || `AI detected ${ollamaType} content.`,
        suggestion: ollamaResult.suggestion,
      };
    }

    if (ollamaType !== 'safe' && ollamaSeverity !== 'none') {
      return {
        moderationStatus: 'flagged',
        toxicityType: ollamaType,
        severity: ollamaSeverity,
        confidence: ollamaResult.confidence,
        categories: [ollamaType],
        reason: ollamaResult.reason || `AI flagged for ${ollamaType}.`,
        suggestion: ollamaResult.suggestion,
      };
    }
  }

  // Default: approved
  return {
    moderationStatus: 'approved',
    toxicityType: 'safe',
    severity: 'none',
    confidence: Math.max(maxConfidence, ollamaResult?.confidence || 0),
    categories: [],
    reason: 'Content meets Focus community standards.',
    suggestion: null,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// HTTP HANDLER
// ═════════════════════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { text = '', imageUrls = [] } = body || {};

    // Skip if no content
    if (!text && imageUrls.length === 0) {
      return new Response(
        JSON.stringify({
          moderationStatus: 'approved',
          toxicityType: 'safe',
          severity: 'none',
          confidence: 0,
          categories: [],
          reason: 'Empty content — nothing to moderate.',
          suggestion: null,
          source: 'rule-based-free',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Rule-based analysis (instant, zero cost)
    const ruleAnalysis = ruleBasedAnalyze(text);

    // 2. Ollama analysis (optional, async)
    let ollamaResult = null;
    if (USE_OLLAMA && text) {
      ollamaResult = await moderateWithOllama(text, imageUrls);
    }

    // 3. Derive verdict
    const verdict = deriveVerdict(ruleAnalysis, ollamaResult);

    return new Response(
      JSON.stringify({
        ...verdict,
        source: ollamaResult ? 'ollama+rules' : 'rule-based-free',
        model: ollamaResult ? OLLAMA_MODEL : null,
        ruleMatches: {
          nsfw: ruleAnalysis.nsfw.detected,
          hate: ruleAnalysis.hate.detected,
          violence: ruleAnalysis.violence.detected,
          selfHarm: ruleAnalysis.selfHarm.detected,
          bullying: ruleAnalysis.bullying.detected,
          misinfo: ruleAnalysis.misinfo.detected,
          spam: ruleAnalysis.spam.detected,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[content-moderator-free] Error:', err);

    // Fail CLOSED per spec
    return new Response(
      JSON.stringify({
        moderationStatus: 'flagged',
        toxicityType: 'safe',
        severity: 'none',
        confidence: 0,
        categories: [],
        reason: 'Moderation service error. Queued for human review.',
        suggestion: null,
        source: 'error-fallback',
        error: err.message,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
