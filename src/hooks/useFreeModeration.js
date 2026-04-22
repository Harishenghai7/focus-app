/**
 * useFreeModeration.js
 * ====================
 * 🛡️  PILLAR 2 — 100% FREE/Open Source AI Content Moderation
 *
 * ZERO API COSTS. ZERO PROPRIETARY DEPENDENCIES.
 * Runs entirely client-side using open-source models:
 *   - TensorFlow.js Toxicity (Google, Apache 2.0)
 *   - NSFWJS (MIT License, client-side NSFW detection)
 *   - Transformers.js (Hugging Face, Apache 2.0)
 *
 * Privacy-first: Content never leaves the browser for analysis.
 *
 * Usage:
 *   const { moderate, moderateImage, lastVerdict, moderating, error } = useFreeModeration();
 *   const verdict = await moderate({ text: caption, imageUrl: imageDataUrl });
 *   // Returns: { moderationStatus, toxicityType, severity, confidence, reason, dbColumns }
 *
 * H2 Innovative — Focus Immune System (Free Edition)
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Free/Open Source AI Models
let toxicityModel = null;
let nsfwModel = null;
let textClassifier = null;

// Model loading states
const modelLoadState = {
  toxicity: { loading: false, loaded: false, error: null },
  nsfw: { loading: false, loaded: false, error: null },
  classifier: { loading: false, loaded: false, error: null },
};

// Default verdict structure
const DEFAULT_VERDICT = Object.freeze({
  moderationStatus: 'approved',
  toxicityType: 'safe',
  severity: 'none',
  confidence: 0,
  categories: [],
  reason: '',
  suggestion: null,
});

// Toxicity labels we care about (free TF.js toxicity model)
const TOXICITY_LABELS = [
  'identity_attack',
  'insult',
  'obscene',
  'severe_toxicity',
  'sexual_explicit',
  'threat',
];

// NSFW categories (free NSFWJS model)
const NSFW_CATEGORIES = ['Porn', 'Hentai', 'Sexy'];
const SAFE_CATEGORIES = ['Drawing', 'Neutral'];

/**
 * Load TensorFlow.js Toxicity Model (FREE - runs locally)
 */
const loadToxicityModel = async () => {
  if (modelLoadState.toxicity.loaded) return toxicityModel;
  if (modelLoadState.toxicity.loading) {
    // Wait for load to complete
    while (modelLoadState.toxicity.loading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return toxicityModel;
  }

  modelLoadState.toxicity.loading = true;
  try {
    const toxicity = await import('@tensorflow-models/toxicity');
    // Threshold 0.7 = strict detection (free model, no API calls)
    toxicityModel = await toxicity.load(0.7, TOXICITY_LABELS);
    modelLoadState.toxicity.loaded = true;
    console.log('[FreeModeration] ✅ Toxicity model loaded (100% free, client-side)');
  } catch (err) {
    modelLoadState.toxicity.error = err.message;
    console.warn('[FreeModeration] ⚠️ Toxicity model failed:', err.message);
  } finally {
    modelLoadState.toxicity.loading = false;
  }
  return toxicityModel;
};

/**
 * Load NSFWJS Model (FREE - runs locally)
 */
const loadNsfwModel = async () => {
  if (modelLoadState.nsfw.loaded) return nsfwModel;
  if (modelLoadState.nsfw.loading) {
    while (modelLoadState.nsfw.loading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return nsfwModel;
  }

  modelLoadState.nsfw.loading = true;
  try {
    const nsfwjs = await import('nsfwjs');
    // Load MobileNetV2 model (optimized for speed, runs on GPU if available)
    nsfwModel = await nsfwjs.load('/models/nsfwjs/', { size: 224 });
    modelLoadState.nsfw.loaded = true;
    console.log('[FreeModeration] ✅ NSFW model loaded (100% free, client-side)');
  } catch (err) {
    modelLoadState.nsfw.error = err.message;
    console.warn('[FreeModeration] ⚠️ NSFW model failed:', err.message);
  } finally {
    modelLoadState.nsfw.loading = false;
  }
  return nsfwModel;
};

/**
 * Load Transformers.js Text Classifier (FREE - runs locally)
 */
const loadTextClassifier = async () => {
  if (modelLoadState.classifier.loaded) return textClassifier;
  if (modelLoadState.classifier.loading) {
    while (modelLoadState.classifier.loading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return textClassifier;
  }

  modelLoadState.classifier.loading = true;
  try {
    const { pipeline } = await import('@xenova/transformers');
    // Use lightweight model for zero-shot classification
    textClassifier = await pipeline(
      'zero-shot-classification',
      'Xenova/mobilebert-uncased-mnli',
      { quantized: true } // Smaller, faster model
    );
    modelLoadState.classifier.loaded = true;
    console.log('[FreeModeration] ✅ Transformers classifier loaded (100% free)');
  } catch (err) {
    modelLoadState.classifier.error = err.message;
    console.warn('[FreeModeration] ⚠️ Text classifier failed:', err.message);
  } finally {
    modelLoadState.classifier.loading = false;
  }
  return textClassifier;
};

/**
 * Preload all models on app start (optional optimization)
 */
export const preloadFreeModerationModels = async () => {
  await Promise.all([
    loadToxicityModel(),
    loadNsfwModel(),
    // loadTextClassifier(), // Optional: heavier model, load on demand
  ]);
};

/**
 * Analyze text toxicity using FREE TensorFlow.js model
 */
const analyzeTextToxicity = async (text) => {
  const model = await loadToxicityModel();
  if (!model) {
    return { detected: false, categories: [], confidence: 0, error: 'Model unavailable' };
  }

  const predictions = await model.classify([text]);

  const detectedCategories = [];
  let maxConfidence = 0;

  predictions.forEach(pred => {
    const match = pred.results[0];
    if (match.match) {
      detectedCategories.push(pred.label);
      maxConfidence = Math.max(maxConfidence, match.probabilities[1]);
    }
  });

  return {
    detected: detectedCategories.length > 0,
    categories: detectedCategories,
    confidence: maxConfidence,
    raw: predictions,
  };
};

/**
 * Analyze image for NSFW content using FREE NSFWJS model
 */
const analyzeImageNsfw = async (imageElementOrUrl) => {
  const model = await loadNsfwModel();
  if (!model) {
    return { nsfw: false, categories: [], confidence: 0, error: 'Model unavailable' };
  }

  let img = imageElementOrUrl;

  // If URL passed, create image element
  if (typeof imageElementOrUrl === 'string') {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageElementOrUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      setTimeout(() => reject(new Error('Image load timeout')), 10000);
    });
  }

  const predictions = await model.classify(img);

  // Check for NSFW categories
  const nsfwPreds = predictions.filter(p => NSFW_CATEGORIES.includes(p.className));
  const safePreds = predictions.filter(p => SAFE_CATEGORIES.includes(p.className));

  const topNsfw = nsfwPreds[0];
  const topSafe = safePreds[0];

  // Threshold: 0.6 for NSFW detection (strict)
  const isNsfw = topNsfw && topNsfw.probability > 0.6;
  const confidence = topNsfw ? topNsfw.probability : 0;

  return {
    nsfw: isNsfw,
    categories: predictions.map(p => p.className),
    confidence,
    topPrediction: topNsfw || topSafe,
    allPredictions: predictions,
  };
};

/**
 * Advanced text analysis using FREE Transformers.js (optional, heavier)
 */
const analyzeTextAdvanced = async (text) => {
  const classifier = await loadTextClassifier();
  if (!classifier) return null;

  const candidateLabels = [
    'hate speech',
    'harassment',
    'misinformation',
    'spam',
    'bullying',
    'self-harm',
    'safe content',
  ];

  const result = await classifier(text, candidateLabels);

  // Get top label and score
  const topLabel = result.labels[0];
  const topScore = result.scores[0];

  return {
    topLabel,
    topScore,
    allLabels: result.labels,
    allScores: result.scores,
    detected: topLabel !== 'safe content' && topScore > 0.7,
  };
};

/**
 * Derive final verdict from free model analysis
 */
const deriveVerdict = (textAnalysis, imageAnalysis, advancedAnalysis = null) => {
  // Zero-tolerance: NSFW images → restricted
  if (imageAnalysis?.nsfw) {
    return {
      moderationStatus: 'restricted',
      toxicityType: 'nsfw',
      severity: imageAnalysis.confidence > 0.8 ? 'critical' : 'high',
      confidence: imageAnalysis.confidence,
      categories: ['nsfw', ...imageAnalysis.categories.filter(c => ['Porn', 'Hentai', 'Sexy'].includes(c))],
      reason: 'Contains adult or sexually explicit content. Focus maintains a zero-tolerance policy.',
      suggestion: 'Please share content that is appropriate for all audiences.',
    };
  }

  // Zero-tolerance: Severe toxicity → restricted
  const severeToxicity = textAnalysis?.categories?.includes('severe_toxicity');
  const threat = textAnalysis?.categories?.includes('threat');
  const identityAttack = textAnalysis?.categories?.includes('identity_attack');

  if (severeToxicity || threat) {
    return {
      moderationStatus: 'restricted',
      toxicityType: severeToxicity ? 'hate' : 'violence',
      severity: 'critical',
      confidence: textAnalysis.confidence,
      categories: textAnalysis.categories,
      reason: severeToxicity
        ? 'Contains severe toxicity or hate speech.'
        : 'Contains credible threats or violent content.',
      suggestion: 'Focus is a community for respectful dialogue. Please revise your content.',
    };
  }

  // High toxicity (insults, obscenity) → restricted
  const hasHighToxicity = textAnalysis?.detected && textAnalysis.confidence > 0.75;
  if (hasHighToxicity) {
    return {
      moderationStatus: 'restricted',
      toxicityType: identityAttack ? 'bullying' : 'hate',
      severity: 'high',
      confidence: textAnalysis.confidence,
      categories: textAnalysis.categories,
      reason: identityAttack
        ? 'Contains personal attacks or identity-based discrimination.'
        : 'Contains offensive language or insults.',
      suggestion: 'Express your thoughts respectfully without attacking others.',
    };
  }

  // Medium toxicity → flagged for review
  const hasMediumToxicity = textAnalysis?.detected && textAnalysis.confidence > 0.5;
  if (hasMediumToxicity) {
    return {
      moderationStatus: 'flagged',
      toxicityType: 'spam',
      severity: 'medium',
      confidence: textAnalysis.confidence,
      categories: textAnalysis.categories,
      reason: 'Potentially problematic content. Under review.',
      suggestion: null,
    };
  }

  // Advanced analysis fallback (misinformation detection)
  if (advancedAnalysis?.detected) {
    return {
      moderationStatus: 'flagged',
      toxicityType: advancedAnalysis.topLabel === 'misinformation' ? 'misinformation' : 'negative_loop',
      severity: advancedAnalysis.topScore > 0.8 ? 'high' : 'medium',
      confidence: advancedAnalysis.topScore,
      categories: [advancedAnalysis.topLabel],
      reason: `Detected potential ${advancedAnalysis.topLabel}. Under review.`,
      suggestion: null,
    };
  }

  // Default: approved
  return {
    ...DEFAULT_VERDICT,
    confidence: Math.max(textAnalysis?.confidence || 0, imageAnalysis?.confidence || 0),
    reason: 'Content meets Focus community standards.',
  };
};

/**
 * Main Hook: useFreeModeration
 */
export const useFreeModeration = () => {
  const [moderating, setModerating] = useState(false);
  const [lastVerdict, setLastVerdict] = useState(null);
  const [error, setError] = useState(null);
  const [modelsReady, setModelsReady] = useState(false);

  // Preload models on mount
  useEffect(() => {
    const init = async () => {
      await Promise.all([loadToxicityModel(), loadNsfwModel()]);
      setModelsReady(true);
    };
    init();
  }, []);

  /**
   * Moderate text + optional image (100% FREE, client-side)
   */
  const moderate = useCallback(async ({ text = '', imageUrl = null, useAdvanced = false } = {}) => {
    setModerating(true);
    setError(null);

    try {
      console.log('[FreeModeration] 🔍 Analyzing content (ZERO API COST)...');

      // Parallel analysis
      const [textAnalysis, imageAnalysis, advancedAnalysis] = await Promise.all([
        text ? analyzeTextToxicity(text) : Promise.resolve(null),
        imageUrl ? analyzeImageNsfw(imageUrl) : Promise.resolve(null),
        useAdvanced && text ? analyzeTextAdvanced(text) : Promise.resolve(null),
      ]);

      // Derive verdict
      const verdict = deriveVerdict(textAnalysis, imageAnalysis, advancedAnalysis);

      // Add DB columns format
      const dbColumns = {
        moderation_status: verdict.moderationStatus,
        moderation_reason: verdict.reason || null,
        moderation_score: typeof verdict.confidence === 'number' ? verdict.confidence : null,
        moderation_categories: Array.isArray(verdict.categories) ? verdict.categories : [],
        moderated_at: new Date().toISOString(),
        moderator_type: 'auto',
      };

      const result = { ...verdict, dbColumns };
      setLastVerdict(result);

      console.log('[FreeModeration] ✅ Verdict:', verdict.moderationStatus, '| Confidence:', verdict.confidence);

      return result;
    } catch (err) {
      console.error('[FreeModeration] ❌ Error:', err);
      setError(err?.message || String(err));

      // Fail CLOSED per spec
      const flagged = {
        ...DEFAULT_VERDICT,
        moderationStatus: 'flagged',
        toxicityType: 'safe',
        severity: 'none',
        confidence: 0,
        reason: 'Moderation analysis failed. Queued for human review.',
        dbColumns: {
          moderation_status: 'flagged',
          moderation_reason: 'Analysis error — queued for review',
          moderation_score: null,
          moderation_categories: [],
          moderated_at: new Date().toISOString(),
          moderator_type: 'auto',
        },
      };
      setLastVerdict(flagged);
      return flagged;
    } finally {
      setModerating(false);
    }
  }, []);

  /**
   * Quick image-only moderation
   */
  const moderateImage = useCallback(async (imageUrl) => {
    return moderate({ text: '', imageUrl });
  }, [moderate]);

  /**
   * Quick text-only moderation
   */
  const moderateText = useCallback(async (text, useAdvanced = false) => {
    return moderate({ text, imageUrl: null, useAdvanced });
  }, [moderate]);

  return {
    moderate,
    moderateImage,
    moderateText,
    moderating,
    lastVerdict,
    error,
    modelsReady,
    // Expose for debugging
    modelStatus: modelLoadState,
  };
};

export default useFreeModeration;

/**
 * Standalone function for non-React usage
 */
export const moderateContentFree = async ({ text, imageUrl }) => {
  const [textAnalysis, imageAnalysis] = await Promise.all([
    text ? analyzeTextToxicity(text) : Promise.resolve(null),
    imageUrl ? analyzeImageNsfw(imageUrl) : Promise.resolve(null),
  ]);

  const verdict = deriveVerdict(textAnalysis, imageAnalysis);

  return {
    ...verdict,
    dbColumns: {
      moderation_status: verdict.moderationStatus,
      moderation_reason: verdict.reason || null,
      moderation_score: verdict.confidence,
      moderation_categories: verdict.categories,
      moderated_at: new Date().toISOString(),
      moderator_type: 'auto',
    },
  };
};
