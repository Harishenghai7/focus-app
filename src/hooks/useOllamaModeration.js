/**
 * useOllamaModeration.js
 * ======================
 * 🛡️  PILLAR 2 — Self-Hosted LLM Moderation (FREE, Open Source)
 *
 * Uses Ollama (https://ollama.com) to run open-source LLMs locally:
 *   - Llama 3 (8B/70B) - Meta, open weights
 *   - Mistral 7B - Apache 2.0 license
 *   - Phi-3 - Microsoft, MIT license
 *   - Gemma 2B/4B/7B - Google, open weights
 *
 * ZERO API COSTS. COMPLETELY PRIVATE.
 * Requires Ollama running locally or on your server.
 *
 * Setup:
 *   1. Install Ollama: https://ollama.com/download
 *   2. Pull model: `ollama pull llama3` or `ollama pull mistral`
 *   3. Run server: `ollama serve` (default: http://localhost:11434)
 *
 * Usage:
 *   const { moderateWithOllama, isAvailable, error } = useOllamaModeration();
 *   const verdict = await moderateWithOllama({ text: caption, imageBase64: imageData });
 *
 * H2 Innovative — Focus Immune System (Self-Hosted Edition)
 */

import { useState, useCallback, useEffect } from 'react';

const OLLAMA_BASE_URL = process.env.REACT_APP_OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.REACT_APP_OLLAMA_MODEL || 'llama3';

// System prompt for content moderation
const MODERATION_SYSTEM_PROMPT = `You are the AI Ethics Moderator for "Focus" — a social platform committed to healthy, authentic connections.

Your task: Analyze the provided content and classify it STRICTLY according to these rules.

ZERO-TOLERANCE VIOLATIONS (immediately reject):
1. Nudity, sexual content, or pornographic material (any form)
2. Hate speech, slurs, or discrimination based on race/religion/gender/orientation
3. Graphic violence, gore, or credible threats
4. Self-harm or suicide promotion/instruction
5. Child exploitation or CSAM (report immediately)

REJECTABLE CONTENT (high threshold):
1. Bullying, personal attacks, body-shaming
2. Deliberate misinformation (health/political)
3. Spam or repetitive promotional content
4. Sexually suggestive but not explicit content

RESPONSE FORMAT — Return ONLY this JSON structure:
{
  "toxicityType": "safe" | "nsfw" | "hate" | "violence" | "self_harm" | "bullying" | "misinformation" | "spam",
  "severity": "none" | "low" | "medium" | "high" | "critical",
  "confidence": 0.0-1.0,
  "violationFound": true/false,
  "categories": ["list", "of", "issues"],
  "reason": "Brief explanation for the user (empathetic tone)",
  "suggestion": "How to fix the content, or null if unsalvageable"
}

Rules:
- Be CONSERVATIVE: When in doubt about safety, classify as violation
- "critical" severity = immediate restriction, no appeal
- "high" severity = restriction with possibility of appeal
- "medium/low" = flag for human review
- No markdown, no explanations outside JSON`;

/**
 * Check if Ollama server is available
 */
export const checkOllamaAvailability = async (baseUrl = OLLAMA_BASE_URL) => {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Short timeout for quick check
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get list of available models from Ollama
 */
export const getAvailableModels = async (baseUrl = OLLAMA_BASE_URL) => {
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map(m => m.name) || [];
  } catch {
    return [];
  }
};

/**
 * Moderate content using Ollama (FREE, self-hosted)
 */
export const moderateWithOllamaApi = async ({
  text = '',
  imageBase64 = null,
  model = DEFAULT_MODEL,
  baseUrl = OLLAMA_BASE_URL,
}) => {
  const messages = [
    { role: 'system', content: MODERATION_SYSTEM_PROMPT },
  ];

  // Build user message with optional image
  const userContent = [];

  if (text) {
    userContent.push({ type: 'text', text: `Content to moderate:\n"""\n${text}\n"""` });
  }

  if (imageBase64) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
    });
  }

  if (userContent.length === 0) {
    throw new Error('No content provided for moderation');
  }

  messages.push({ role: 'user', content: userContent });

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      format: 'json',
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for consistent results
        num_predict: 512, // Limit response length
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.message?.content || '{}';

  // Parse JSON response
  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    // Fallback: try to extract JSON from markdown code blocks
    const jsonMatch = rawContent.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch {
        parsed = {};
      }
    } else {
      parsed = {};
    }
  }

  // Validate and normalize
  const toxicityType = parsed.toxicityType || 'safe';
  const severity = parsed.severity || 'none';
  const confidence = Math.max(0, Math.min(1, parsed.confidence || 0));
  const violationFound = parsed.violationFound || false;

  // Map to moderation status
  let moderationStatus = 'approved';
  if (severity === 'critical' || (violationFound && confidence > 0.8)) {
    moderationStatus = 'restricted';
  } else if (violationFound || severity === 'medium' || severity === 'high') {
    moderationStatus = 'flagged';
  }

  return {
    moderationStatus,
    toxicityType,
    severity,
    confidence,
    violationFound,
    categories: parsed.categories || [],
    reason: parsed.reason || '',
    suggestion: parsed.suggestion || null,
    raw: parsed,
    model,
  };
};

/**
 * React Hook: useOllamaModeration
 */
export const useOllamaModeration = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check availability on mount
  useEffect(() => {
    const check = async () => {
      const available = await checkOllamaAvailability();
      setIsAvailable(available);

      if (available) {
        const models = await getAvailableModels();
        setAvailableModels(models);
        // Prefer llama3 or mistral if available
        if (models.includes('llama3')) {
          setSelectedModel('llama3');
        } else if (models.includes('mistral')) {
          setSelectedModel('mistral');
        } else if (models.length > 0) {
          setSelectedModel(models[0]);
        }
      }
    };
    check();
  }, []);

  /**
   * Moderate content with Ollama
   */
  const moderate = useCallback(async ({ text, imageBase64 } = {}) => {
    if (!isAvailable) {
      return {
        moderationStatus: 'flagged',
        toxicityType: 'safe',
        severity: 'none',
        confidence: 0,
        reason: 'Ollama moderation unavailable. Queued for review.',
        dbColumns: {
          moderation_status: 'flagged',
          moderation_reason: 'Self-hosted AI unavailable — queued for review',
          moderation_score: null,
          moderation_categories: [],
          moderated_at: new Date().toISOString(),
          moderator_type: 'auto',
        },
      };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await moderateWithOllamaApi({
        text,
        imageBase64,
        model: selectedModel,
      });

      const dbColumns = {
        moderation_status: result.moderationStatus,
        moderation_reason: result.reason || null,
        moderation_score: result.confidence,
        moderation_categories: result.categories,
        moderated_at: new Date().toISOString(),
        moderator_type: 'auto',
      };

      const fullResult = { ...result, dbColumns };
      return fullResult;
    } catch (err) {
      console.error('[OllamaModeration] Error:', err);
      setError(err.message);

      // Fail closed
      return {
        moderationStatus: 'flagged',
        toxicityType: 'safe',
        severity: 'none',
        confidence: 0,
        reason: 'Moderation analysis failed. Queued for review.',
        dbColumns: {
          moderation_status: 'flagged',
          moderation_reason: 'Analysis error — queued for review',
          moderation_score: null,
          moderation_categories: [],
          moderated_at: new Date().toISOString(),
          moderator_type: 'auto',
        },
      };
    } finally {
      setLoading(false);
    }
  }, [isAvailable, selectedModel]);

  return {
    moderate,
    isAvailable,
    availableModels,
    selectedModel,
    setSelectedModel,
    loading,
    error,
    checkAvailability: () => checkOllamaAvailability().then(setIsAvailable),
  };
};

export default useOllamaModeration;
