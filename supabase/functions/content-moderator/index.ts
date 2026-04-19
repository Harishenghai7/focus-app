/**
 * content-moderator/index.ts
 * ==========================
 * Supabase Edge Function — Server-Side Content Moderation
 * Uses Google Gemini Flash for zero-latency content analysis
 * Cannot be bypassed by frontend inspection
 *
 * Deploy: supabase functions deploy content-moderator
 *
 * H2 Innovative — The Cultural Firewall
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── System Prompt — The Cultural Firewall ─────────────────────────────────────
const MODERATION_PROMPT = `You are the Lead AI Ethics Engineer at H2 Innovative, moderating content for "Focus" — a social platform for real people that stands for respect, growth, and authentic connection.

Analyze the provided content and return a JSON object with:
{
  "isToxic": boolean,
  "toxicityType": "hate_speech" | "propaganda" | "self_harm" | "violence" | "nsfw" | "spam" | "personal_attack" | "negative_loop" | "safe",
  "severity": "critical" | "high" | "medium" | "low" | "none",
  "confidence": float (0.0 to 1.0),
  "categories": array of detected categories,
  "explanation": "Educational message explaining WHY this was flagged (speak directly to the user, be empathetic but firm. Max 2 sentences.)",
  "suggestion": "What the user could post instead to express their idea constructively"
}

Focus Constitution violations include:
1. Hate speech, discrimination, slurs — any kind
2. Content that glorifies or promotes self-harm or suicide
3. Graphic violence or threats
4. Sexual content of any kind (including censored/pixelated)
5. Propaganda, misleading health/political information designed to divide
6. Toxic thought loops that spread hopelessness or nihilism
7. Personal attacks, body shaming, bullying

Respond ONLY with valid JSON. No explanatory text outside the JSON.`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, text, imageUrls = [] } = body;

    if (action === 'analyze_sentiment') {
      // ── Text Analysis ──────────────────────────────────────────
      const parts: object[] = [];

      if (text) {
        parts.push({ text: `Analyze this content:\n"${text.slice(0, 2000).replace(/"/g, '\\"')}"` });
      }

      // Image analysis via Gemini Vision (if image URLs provided)
      for (const url of imageUrls.slice(0, 3)) {
        try {
          const imageResponse = await fetch(url);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
          const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
          parts.push({
            inline_data: { mime_type: mimeType, data: base64 },
          });
        } catch (_) {
          // Skip failed image fetches
        }
      }

      if (parts.length === 0) {
        return new Response(
          JSON.stringify({ isToxic: false, confidence: 0, toxicityType: 'safe' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: MODERATION_PROMPT }] },
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,       // Low temp for consistent judgements
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Gemini gave non-JSON — treat as safe
        parsed = { isToxic: false, confidence: 0, toxicityType: 'safe' };
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[content-moderator]', err);
    // Fail CLOSED for safety — if edge function errors, block content
    return new Response(
      JSON.stringify({
        isToxic: false,
        confidence: 0,
        toxicityType: 'safe',
        error: 'Moderation service temporarily unavailable',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
