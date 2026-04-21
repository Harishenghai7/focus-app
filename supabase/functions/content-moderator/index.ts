/**
 * content-moderator/index.ts
 * ==========================
 * 🛡️  PILLAR 2 — Focus Content Moderator (Edge Function)
 *
 * Server-side AI moderation using Google Gemini (vision-capable).
 * Cannot be bypassed by the client.
 *
 * CONTRACT:
 * - Accepts: { text?: string, imageUrls?: string[], contentType?: string }
 * - Returns: {
 *     moderationStatus: 'approved' | 'restricted' | 'flagged',
 *     toxicityType: 'hate' | 'nsfw' | 'violence' | 'self_harm' | 'bullying'
 *                 | 'misinformation' | 'spam' | 'safe',
 *     severity: 'critical' | 'high' | 'medium' | 'low' | 'none',
 *     confidence: number,           // 0.0–1.0
 *     categories: string[],
 *     reason: string,               // Human-readable, empathetic
 *     suggestion?: string,          // What the user could post instead
 *   }
 *
 * VERDICT LOGIC (ruthless per spec):
 *   - Any NSFW / sexual / pornographic                   → restricted
 *   - Any hate speech / slurs / discrimination           → restricted
 *   - Any self-harm / suicide promotion                  → restricted
 *   - Any graphic violence / threats                     → restricted
 *   - Misleading health / political propaganda (high)    → restricted
 *   - Bullying / micro-aggressions / personal attacks    → restricted
 *   - Ambiguous or low-confidence toxicity (≥0.4)        → flagged (admin review)
 *   - Otherwise                                          → approved
 *
 * No blurs. No censors. Just total isolation of toxicity per spec.
 *
 * Deploy: supabase functions deploy content-moderator
 * Env:    supabase secrets set GEMINI_API_KEY=AIzaSy...
 *
 * H2 Innovative — The Cultural Firewall
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
// Gemini 2.5 Flash — best price/latency for classification with vision.
// Upgrade to gemini-2.5-pro if stricter reasoning is required.
const GEMINI_MODEL = Deno.env.get('GEMINI_MODERATION_MODEL') ?? 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Cultural Firewall system prompt ──────────────────────────────────────────
const MODERATION_PROMPT = `You are the Lead AI Ethics Engineer at H2 Innovative, guarding "Focus" — a social platform built for authentic people and healthy connection. You apply the Focus Constitution with zero tolerance for toxicity.

Your job: classify the provided content into one of these toxicity types and produce a strict JSON verdict.

Violations (any single one is disqualifying):
1. NSFW / sexual / pornographic imagery or text (including censored, pixelated, or euphemistic)
2. Hate speech, slurs, discrimination based on race/religion/gender/orientation/caste
3. Graphic violence, gore, or credible threats
4. Content glorifying, promoting, or instructing self-harm or suicide
5. Bullying, body-shaming, personal attacks, micro-aggressions
6. Deliberate misinformation or propaganda (especially health/political divisive content)
7. Spam / repetitive promotional content
8. Negative thought loops designed to spread hopelessness/nihilism

Return ONLY a valid JSON object matching this schema exactly:
{
  "toxicityType":  "hate" | "nsfw" | "violence" | "self_harm" | "bullying" | "misinformation" | "spam" | "negative_loop" | "safe",
  "severity":      "critical" | "high" | "medium" | "low" | "none",
  "confidence":     0.0,
  "categories":    ["..."],
  "reason":        "Short, direct, empathetic explanation (max 2 sentences) addressed to the author.",
  "suggestion":    "What the author could post instead to express the idea constructively, OR null if unsalvageable."
}

Rules:
- Be ruthless on NSFW and hate. If you are even slightly unsure about nudity, classify it as "nsfw" with "high" severity.
- For text, evaluate intent (is the author attacking someone?) not just keywords.
- For images, describe what you see and judge against the constitution.
- Respond with JSON ONLY. No markdown fences, no explanation outside JSON.`;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map Gemini's classification → spec verdict enum. RUTHLESS: any high-severity
 *  violation = restricted. Medium/low with decent confidence = flagged (admin). */
function deriveVerdict(geminiJson: any): {
  moderationStatus: 'approved' | 'restricted' | 'flagged';
  toxicityType: string;
  severity: string;
  confidence: number;
  categories: string[];
  reason: string;
  suggestion: string | null;
} {
  const toxicityType = (geminiJson?.toxicityType || 'safe').toString().toLowerCase();
  const severity = (geminiJson?.severity || 'none').toString().toLowerCase();
  const confidence = Math.max(0, Math.min(1, Number(geminiJson?.confidence) || 0));
  const categories = Array.isArray(geminiJson?.categories) ? geminiJson.categories : [];
  const reason = typeof geminiJson?.reason === 'string' ? geminiJson.reason : '';
  const suggestion = typeof geminiJson?.suggestion === 'string' ? geminiJson.suggestion : null;

  // Zero-tolerance categories → immediately restricted (shadow-ban)
  const zeroTolerance = ['nsfw', 'hate', 'violence', 'self_harm'];
  if (zeroTolerance.includes(toxicityType)) {
    return {
      moderationStatus: 'restricted',
      toxicityType, severity: severity === 'none' ? 'high' : severity,
      confidence: Math.max(confidence, 0.75),
      categories, reason: reason || 'Violates Focus Constitution (zero-tolerance category).',
      suggestion,
    };
  }

  // High-severity bullying/misinfo/spam → restricted
  if ((severity === 'critical' || severity === 'high') && toxicityType !== 'safe') {
    return { moderationStatus: 'restricted', toxicityType, severity, confidence, categories, reason, suggestion };
  }

  // Medium-severity, confident enough → flagged for admin review
  if (toxicityType !== 'safe' && (severity === 'medium' || confidence >= 0.6)) {
    return { moderationStatus: 'flagged', toxicityType, severity, confidence, categories, reason, suggestion };
  }

  // Low confidence ambiguous → flagged for human review
  if (toxicityType !== 'safe' && confidence >= 0.4) {
    return { moderationStatus: 'flagged', toxicityType, severity, confidence, categories, reason, suggestion };
  }

  // Default: approved
  return {
    moderationStatus: 'approved',
    toxicityType: 'safe', severity: 'none', confidence,
    categories, reason: reason || '', suggestion: null,
  };
}

/** Convert remote image URL → base64 inline_data part for Gemini Vision. */
async function urlToInlinePart(url: string): Promise<object | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    // Guard against huge uploads — Gemini vision accepts up to ~20MB
    if (buf.byteLength > 15 * 1024 * 1024) return null;
    // Base64 encode in chunks to avoid "too many arguments" on fromCharCode
    let bin = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < buf.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + CHUNK)) as number[]);
    }
    const base64 = btoa(bin);
    const mime = r.headers.get('content-type') || 'image/jpeg';
    return { inline_data: { mime_type: mime, data: base64 } };
  } catch {
    return null;
  }
}

// ── HTTP handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!GEMINI_API_KEY) {
      // Fail CLOSED per spec: if AI is unavailable, flag for human review.
      return new Response(JSON.stringify({
        moderationStatus: 'flagged',
        toxicityType: 'safe',
        severity: 'none',
        confidence: 0,
        categories: [],
        reason: 'GEMINI_API_KEY not configured on the edge function. Content queued for manual review.',
        suggestion: null,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const { text = '', imageUrls = [] } = body || {};

    const parts: object[] = [];
    if (text && typeof text === 'string') {
      parts.push({ text: `Text to classify:\n"""\n${text.slice(0, 3000).replace(/"""/g, '\\"\\"\\"')}\n"""` });
    }

    // Attach up to 4 images (cost control)
    for (const url of (Array.isArray(imageUrls) ? imageUrls : []).slice(0, 4)) {
      const part = await urlToInlinePart(url);
      if (part) parts.push(part);
    }

    if (parts.length === 0) {
      return new Response(JSON.stringify({
        moderationStatus: 'approved',
        toxicityType: 'safe', severity: 'none', confidence: 0,
        categories: [], reason: 'Empty content — nothing to moderate.', suggestion: null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const geminiResp = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: MODERATION_PROMPT }] },
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
        // Gemini's own built-in safety thresholds left at default — we want to
        // SEE the violation metadata so we can shadow-ban accurately.
      }),
    });

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error('[content-moderator] Gemini API error', geminiResp.status, errText);
      // Fail CLOSED per spec
      return new Response(JSON.stringify({
        moderationStatus: 'flagged',
        toxicityType: 'safe', severity: 'none', confidence: 0,
        categories: [], reason: 'AI moderation temporarily unavailable. Queued for review.',
        suggestion: null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const geminiData = await geminiResp.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    let parsed: any = {};
    try { parsed = JSON.parse(rawText); } catch { parsed = {}; }

    const verdict = deriveVerdict(parsed);

    return new Response(JSON.stringify({ ...verdict, model: GEMINI_MODEL, raw: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[content-moderator] unhandled', err);
    return new Response(JSON.stringify({
      moderationStatus: 'flagged',
      toxicityType: 'safe', severity: 'none', confidence: 0,
      categories: [], reason: 'Moderation service error. Queued for review.',
      suggestion: null,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
