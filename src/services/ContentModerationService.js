// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ FOCUS CONTENT MODERATION SERVICE - The Purity Engine
// ═══════════════════════════════════════════════════════════════════════════════
// Layer 1: Real-time Pre-Upload Gateway
// Layer 2: Purpose-Driven Quality Control  
// Layer 3: Ruthless Enforcement
// ═══════════════════════════════════════════════════════════════════════════════

import * as toxicity from '@tensorflow-models/toxicity';
import * as nsfwjs from 'nsfwjs';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION - The Sacred Thresholds
// ═══════════════════════════════════════════════════════════════════════════════

const MODERATION_CONFIG = {
    // Vision Analysis Thresholds (0-1 scale)
    NSFW_THRESHOLDS: {
        PORN: 0.01,        // Zero tolerance - 1% threshold
        HENTAI: 0.01,      // Zero tolerance
        SEXY: 0.15,        // Suggestive content
        VIOLENCE: 0.05,    // Violence/gore
        BLURRED: 0.30,     // Excessive blur/censorship
    },
    
    // Text Analysis Thresholds
    TEXT_THRESHOLDS: {
        TOXICITY: 0.70,           // General toxicity
        SEVERE_TOXICITY: 0.50,    // Severe toxicity
        IDENTITY_ATTACK: 0.70,    // Hate speech
        INSULT: 0.80,             // Insults
        THREAT: 0.30,             // Threats (lower threshold)
        SEXUALLY_EXPLICIT: 0.50,  // Sexual content in text
        OBSCENE: 0.70,            // Obscenity
        SPAM: 0.80,               // Spam detection
    },
    
    // Quality Control Thresholds
    QUALITY_THRESHOLDS: {
        MIN_IMAGE_WIDTH: 320,
        MIN_IMAGE_HEIGHT: 320,
        MAX_BLUR_SCORE: 0.40,     // Reject if too blurry
        MIN_BRIGHTNESS: 0.15,     // Too dark
        MAX_BRIGHTNESS: 0.95,     // Overexposed
        MIN_CONTRAST: 0.10,       // Low contrast
    },
    
    // API Configuration (Sightengine fallback)
    SIGHTENGINE: {
        ENABLED: Boolean(process.env.REACT_APP_SIGHTENGINE_API_USER && process.env.REACT_APP_SIGHTENGINE_API_SECRET),
        API_URL: 'https://api.sightengine.com/1.0/check.json',
        MODELS: 'nudity,wad,offensive,text-content,face-attributes,gore,qr-content',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL INITIALIZATION - The AI Guardians
// ═══════════════════════════════════════════════════════════════════════════════

let toxicityModel = null;
let nsfwModel = null;
let modelsLoading = false;
let modelsLoaded = false;

/**
 * Initialize TensorFlow.js models for content analysis
 */
export const initializeModerationModels = async () => {
    if (modelsLoaded || modelsLoading) return;
    
    modelsLoading = true;

    
    try {
        // Load toxicity model for text analysis
        toxicityModel = await toxicity.load(0.7, [
            'identity_attack',
            'insult',
            'threat',
            'toxicity',
            'severe_toxicity',
            'sexually_explicit',
            'obscene'
        ]);
        
        // Load NSFW detection model for images
        nsfwModel = await nsfwjs.load('/models/nsfwjs/', { type: 'graph' });
        
        modelsLoaded = true;

    } catch (error) {
        console.error('[ContentModeration] Model initialization failed:', error);
        // Continue without models - will use API fallback
    } finally {
        modelsLoading = false;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VISION ANALYSIS - The All-Seeing Eye
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze image using NSFWJS (client-side TensorFlow.js)
 * @param {HTMLImageElement|ImageData|File} imageInput
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeImageNSFW = async (imageInput) => {
    if (!nsfwModel) {
        await initializeModerationModels();
    }
    
    try {
        let img = imageInput;
        
        // If input is a File, create image element
        if (imageInput instanceof File) {
            img = await fileToImage(imageInput);
        }
        
        const predictions = await nsfwModel.classify(img);
        
        // Parse predictions
        const results = {
            isSafe: true,
            scores: {},
            violations: [],
            safetyScore: 1.0,
        };
        
        predictions.forEach(pred => {
            results.scores[pred.className.toLowerCase()] = pred.probability;
            
            // Check against thresholds
            switch(pred.className.toLowerCase()) {
                case 'porn':
                    if (pred.probability > MODERATION_CONFIG.NSFW_THRESHOLDS.PORN) {
                        results.isSafe = false;
                        results.violations.push({
                            type: 'NUDITY_PORN',
                            score: pred.probability,
                            threshold: MODERATION_CONFIG.NSFW_THRESHOLDS.PORN,
                        });
                    }
                    break;
                case 'hentai':
                    if (pred.probability > MODERATION_CONFIG.NSFW_THRESHOLDS.HENTAI) {
                        results.isSafe = false;
                        results.violations.push({
                            type: 'NUDITY_HENTAI',
                            score: pred.probability,
                            threshold: MODERATION_CONFIG.NSFW_THRESHOLDS.HENTAI,
                        });
                    }
                    break;
                case 'sexy':
                    if (pred.probability > MODERATION_CONFIG.NSFW_THRESHOLDS.SEXY) {
                        results.violations.push({
                            type: 'SUGGESTIVE',
                            score: pred.probability,
                            threshold: MODERATION_CONFIG.NSFW_THRESHOLDS.SEXY,
                            severity: 'warning'
                        });
                    }
                    break;
                case 'violence':
                    if (pred.probability > MODERATION_CONFIG.NSFW_THRESHOLDS.VIOLENCE) {
                        results.isSafe = false;
                        results.violations.push({
                            type: 'VIOLENCE',
                            score: pred.probability,
                            threshold: MODERATION_CONFIG.NSFW_THRESHOLDS.VIOLENCE,
                        });
                    }
                    break;
            }
        });
        
        // Calculate overall safety score
        const dangerousScores = predictions
            .filter(p => ['porn', 'hentai', 'violence'].includes(p.className.toLowerCase()))
            .map(p => p.probability);
        
        results.safetyScore = 1 - Math.max(...dangerousScores, 0);
        
        return results;
    } catch (error) {
        console.error('[ContentModeration] Image analysis failed:', error);
        throw new Error('Failed to analyze image content');
    }
};

/**
 * Analyze image quality (blur, brightness, contrast)
 * @param {HTMLImageElement|File} imageInput
 * @returns {Promise<Object>} Quality metrics
 */
export const analyzeImageQuality = async (imageInput) => {
    try {
        let img = imageInput;
        if (imageInput instanceof File) {
            img = await fileToImage(imageInput);
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize for analysis
        canvas.width = 400;
        canvas.height = 400;
        ctx.drawImage(img, 0, 0, 400, 400);
        
        const imageData = ctx.getImageData(0, 0, 400, 400);
        const data = imageData.data;
        
        // Calculate brightness
        let totalBrightness = 0;
        let pixelCount = data.length / 4;
        
        // Calculate contrast (edge detection via variance)
        let totalVariance = 0;
        let meanBrightness = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
        }
        
        meanBrightness = totalBrightness / pixelCount;
        
        // Calculate variance
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            totalVariance += Math.pow(brightness - meanBrightness, 2);
        }
        
        const variance = totalVariance / pixelCount;
        const contrast = Math.sqrt(variance) / 255;
        const normalizedBrightness = meanBrightness / 255;
        
        // Estimate blur using Laplacian variance (simplified)
        const blurScore = estimateBlur(data, 400, 400);
        
        const results = {
            brightness: normalizedBrightness,
            contrast,
            blurScore,
            dimensions: { width: img.naturalWidth, height: img.naturalHeight },
            isHighQuality: true,
            issues: [],
        };
        
        // Quality checks
        if (img.naturalWidth < MODERATION_CONFIG.QUALITY_THRESHOLDS.MIN_IMAGE_WIDTH ||
            img.naturalHeight < MODERATION_CONFIG.QUALITY_THRESHOLDS.MIN_IMAGE_HEIGHT) {
            results.isHighQuality = false;
            results.issues.push('RESOLUTION_TOO_LOW');
        }
        
        if (blurScore > MODERATION_CONFIG.QUALITY_THRESHOLDS.MAX_BLUR_SCORE) {
            results.isHighQuality = false;
            results.issues.push('TOO_BLURRY');
        }
        
        if (normalizedBrightness < MODERATION_CONFIG.QUALITY_THRESHOLDS.MIN_BRIGHTNESS) {
            results.isHighQuality = false;
            results.issues.push('TOO_DARK');
        }
        
        if (normalizedBrightness > MODERATION_CONFIG.QUALITY_THRESHOLDS.MAX_BRIGHTNESS) {
            results.isHighQuality = false;
            results.issues.push('OVEREXPOSED');
        }
        
        if (contrast < MODERATION_CONFIG.QUALITY_THRESHOLDS.MIN_CONTRAST) {
            results.isHighQuality = false;
            results.issues.push('LOW_CONTRAST');
        }
        
        return results;
    } catch (error) {
        console.error('[ContentModeration] Quality analysis failed:', error);
        throw error;
    }
};

/**
 * Fallback image analysis using Sightengine API
 * @param {File} file
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeImageSightengine = async (file) => {
    if (!MODERATION_CONFIG.SIGHTENGINE.ENABLED) {
        return null; // API not configured
    }
    
    try {
        const formData = new FormData();
        formData.append('media', file);
        formData.append('models', MODERATION_CONFIG.SIGHTENGINE.MODELS);
        formData.append('api_user', process.env.REACT_APP_SIGHTENGINE_API_USER);
        formData.append('api_secret', process.env.REACT_APP_SIGHTENGINE_API_SECRET);
        
        const response = await fetch(MODERATION_CONFIG.SIGHTENGINE.API_URL, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) throw new Error('Sightengine API error');
        
        const data = await response.json();
        
        return parseSightengineResponse(data);
    } catch (error) {
        console.error('[ContentModeration] Sightengine API failed:', error);
        return null;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT ANALYSIS - The Word Sentinel
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze text for toxicity using TensorFlow.js
 * @param {string} text
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeTextToxicity = async (text) => {
    if (!toxicityModel) {
        await initializeModerationModels();
    }
    
    if (!text || text.trim().length === 0) {
        return {
            isSafe: true,
            safetyScore: 1.0,
            violations: [],
            categories: {},
        };
    }
    
    try {
        const predictions = await toxicityModel.classify(text);
        
        const results = {
            isSafe: true,
            safetyScore: 1.0,
            violations: [],
            categories: {},
            sentiment: analyzeSentiment(text),
        };
        
        predictions.forEach(prediction => {
            const label = prediction.label;
            const match = prediction.results[0].match;
            const probability = prediction.results[0].probabilities[1];
            
            results.categories[label] = {
                match,
                probability,
            };
            
            // Check against thresholds
            const threshold = MODERATION_CONFIG.TEXT_THRESHOLDS[label.toUpperCase()] || 0.8;
            
            if (match || probability > threshold) {
                const isSevere = probability > threshold;
                
                if (isSevere) {
                    results.isSafe = false;
                    results.violations.push({
                        type: label.toUpperCase(),
                        score: probability,
                        threshold,
                        text: extractProblematicText(text, label),
                    });
                }
            }
        });
        
        // Calculate safety score
        const maxToxicity = Math.max(
            ...Object.values(results.categories).map(c => c.probability),
            0
        );
        results.safetyScore = 1 - maxToxicity;
        
        return results;
    } catch (error) {
        console.error('[ContentModeration] Text analysis failed:', error);
        // Fail open - allow content if analysis fails
        return {
            isSafe: true,
            safetyScore: 1.0,
            violations: [],
            categories: {},
            error: true,
        };
    }
};

/**
 * Check for misinformation patterns in text
 * @param {string} text
 * @returns {Object} Misinformation analysis
 */
export const analyzeMisinformation = (text) => {
    const indicators = {
        ALL_CAPS_RATIO: (text.match(/[A-Z]/g) || []).length / text.length,
        EXCLAMATION_COUNT: (text.match(/!/g) || []).length,
        CLICKBAIT_PATTERNS: [
            /you won'?t believe/i,
            /shocking/i,
            /this is crazy/i,
            /mind blown/i,
            /must watch/i,
            /viral/i,
            /exclusive leak/i,
            /breaking.*urgent/i,
        ],
        SENSATIONAL_WORDS: [
            'miracle', 'cure', 'doctors hate', 'secret', 'conspiracy',
            'hoax', 'fake news', 'they don\'t want you to know'
        ],
    };
    
    const results = {
        clickbaitScore: 0,
        sensationalScore: 0,
        capsScore: Math.min(indicators.ALL_CAPS_RATIO * 3, 1),
        exclamationScore: Math.min(indicators.EXCLAMATION_COUNT / 3, 1),
        isFlagged: false,
        reasons: [],
    };
    
    // Check clickbait patterns
    indicators.CLICKBAIT_PATTERNS.forEach(pattern => {
        if (pattern.test(text)) {
            results.clickbaitScore += 0.3;
            results.reasons.push('CLICKBAIT_PATTERN');
        }
    });
    
    // Check sensational words
    indicators.SENSATIONAL_WORDS.forEach(word => {
        if (text.toLowerCase().includes(word)) {
            results.sensationalScore += 0.2;
        }
    });
    
    // Normalize scores
    results.clickbaitScore = Math.min(results.clickbaitScore, 1);
    results.sensationalScore = Math.min(results.sensationalScore, 1);
    
    // Flag if total score is high
    const totalScore = (results.clickbaitScore + results.sensationalScore + 
                       results.capsScore + results.exclamationScore) / 4;
    
    if (totalScore > 0.5) {
        results.isFlagged = true;
    }
    
    return results;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE CONTENT SCAN - The Purity Ritual
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Perform complete content scan before upload
 * @param {Object} content
 * @param {File[]} content.mediaFiles
 * @param {string} content.caption
 * @param {string} content.type - 'post', 'boltz', 'flash', 'comment'
 * @returns {Promise<Object>} Complete moderation results
 */
export const performPurityScan = async (content) => {
    const startTime = performance.now();
    
    const results = {
        passed: true,
        blocked: false,
        safetyHash: null,
        contentRating: 1.0,
        violations: [],
        warnings: [],
        mediaResults: [],
        textResult: null,
        processingTime: 0,
        scanTimestamp: new Date().toISOString(),
    };
    
    try {
        // 1. Scan media files
        if (content.mediaFiles && content.mediaFiles.length > 0) {
            for (const file of content.mediaFiles) {
                const mediaResult = await scanMediaFile(file);
                results.mediaResults.push(mediaResult);
                
                if (!mediaResult.isSafe) {
                    results.passed = false;
                    results.violations.push(...mediaResult.violations);
                }
                
                if (mediaResult.warnings && mediaResult.warnings.length > 0) {
                    results.warnings.push(...mediaResult.warnings);
                }
            }
        }
        
        // 2. Scan caption/text
        if (content.caption) {
            const textResult = await scanTextContent(content.caption);
            results.textResult = textResult;
            
            if (!textResult.isSafe) {
                results.passed = false;
                results.violations.push(...textResult.violations);
            }
            
            if (textResult.misinformation?.isFlagged) {
                results.warnings.push({
                    type: 'MISINFORMATION_RISK',
                    score: textResult.misinformation.clickbaitScore,
                });
            }
        }
        
        // 3. Calculate content rating (0-1 scale, higher = safer)
        const mediaSafety = results.mediaResults.length > 0
            ? results.mediaResults.reduce((acc, m) => acc * m.safetyScore, 1)
            : 1;
        
        const textSafety = results.textResult?.safetyScore || 1;
        results.contentRating = (mediaSafety * textSafety) ** 0.5; // Geometric mean
        
        // 4. Determine block severity
        if (results.violations.length > 0) {
            const hasSevere = results.violations.some(v => 
                ['NUDITY_PORN', 'NUDITY_HENTAI', 'VIOLENCE', 'THREAT'].includes(v.type)
            );
            
            results.blocked = hasSevere;
            
            // Generate safety hash for database
            results.safetyHash = await generateSafetyHash(results);
        }
        
    } catch (error) {
        console.error('[ContentModeration] Purity scan failed:', error);
        results.passed = false;
        results.error = error.message;
    }
    
    results.processingTime = performance.now() - startTime;
    
    return results;
};

/**
 * Scan a single media file
 * @param {File} file
 * @returns {Promise<Object>} Media scan results
 */
const scanMediaFile = async (file) => {
    // Guard against null/undefined file
    if (!file) {
        return {
            fileName: 'unknown',
            fileType: 'unknown',
            isSafe: false,
            safetyScore: 0,
            violations: [{ type: 'INVALID_FILE', message: 'No file provided' }],
            warnings: [],
            qualityIssues: [],
        };
    }

    const result = {
        fileName: file?.name || 'unknown',
        fileType: file?.type || 'unknown',
        isSafe: true,
        safetyScore: 1.0,
        violations: [],
        warnings: [],
        qualityIssues: [],
    };

    try {
        // 1. Check file type
        if (!isAllowedFileType(file)) {
            result.isSafe = false;
            result.violations.push({
                type: 'INVALID_FILE_TYPE',
                message: 'File type not allowed',
            });
            return result;
        }
        
        // 2. Image analysis
        if (file.type.startsWith('image/')) {
            // NSFW detection
            const nsfwResult = await analyzeImageNSFW(file);
            result.safetyScore = nsfwResult.safetyScore;
            
            if (!nsfwResult.isSafe) {
                result.isSafe = false;
                result.violations.push(...nsfwResult.violations);
            }
            
            // Quality analysis
            const qualityResult = await analyzeImageQuality(file);
            
            if (!qualityResult.isHighQuality) {
                result.qualityIssues = qualityResult.issues;
                result.warnings.push({
                    type: 'QUALITY_ISSUES',
                    issues: qualityResult.issues,
                });
            }
            
            // API fallback for additional analysis
            const apiResult = await analyzeImageSightengine(file);
            if (apiResult) {
                // Merge API results
                if (!apiResult.isSafe) {
                    result.isSafe = false;
                    result.violations.push(...apiResult.violations);
                }
            }
        }
        
        // 3. Video analysis (simplified - would need frame extraction)
        if (file.type.startsWith('video/')) {
            // For videos, we'd extract frames and analyze
            // This is a simplified version
            result.warnings.push({
                type: 'VIDEO_SCAN_LIMITED',
                message: 'Video content will be scanned post-upload',
            });
        }
        
    } catch (error) {
        console.error('[ContentModeration] Media scan error:', error);
        result.error = error.message;
    }
    
    return result;
};

/**
 * Scan text content
 * @param {string} text
 * @returns {Promise<Object>} Text scan results
 */
const scanTextContent = async (text) => {
    const result = await analyzeTextToxicity(text);
    result.misinformation = analyzeMisinformation(text);
    return result;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENFORCEMENT ACTIONS - The Hammer
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Record content violation in database
 * @param {string} userId
 * @param {Object} violation
 * @returns {Promise<void>}
 */
export const recordViolation = async (userId, violation) => {
    try {
        const { error } = await supabase
            .from('content_violations')
            .insert({
                user_id: userId,
                violation_type: violation.type,
                violation_score: violation.score,
                content_preview: violation.text?.substring(0, 200),
                severity: violation.severity || 'medium',
                created_at: new Date().toISOString(),
            });
        
        if (error) throw error;
        
        // Check if user should be flagged
        await checkUserViolationStatus(userId);
    } catch (error) {
        console.error('[ContentModeration] Failed to record violation:', error);
    }
};

/**
 * Check user violation count and take action if needed
 * @param {string} userId
 */
const checkUserViolationStatus = async (userId) => {
    try {
        const { data: violations, error } = await supabase
            .from('content_violations')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        if (error) throw error;
        
        const recentViolations = violations || [];
        const severeCount = recentViolations.filter(v => v.severity === 'high').length;
        const totalCount = recentViolations.length;
        
        // Take action based on violation history
        if (severeCount >= 3 || totalCount >= 10) {
            // Flag account for review
            await supabase
                .from('profiles')
                .update({
                    can_post: false,
                    restriction_reason: 'AUTOMATED: Multiple content violations detected',
                    moderation_flagged_at: new Date().toISOString(),
                })
                .eq('id', userId);
        }
    } catch (error) {
        console.error('[ContentModeration] Failed to check violation status:', error);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS - The Toolbox
// ═══════════════════════════════════════════════════════════════════════════════

const fileToImage = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
};

const estimateBlur = (imageData, width, height) => {
    // Simplified Laplacian variance calculation
    const data = imageData;
    let sum = 0;
    let sumSq = 0;
    let count = 0;
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const val = data[idx]; // Use red channel
            
            // Simple Laplacian
            const laplacian = Math.abs(
                4 * val -
                data[idx - 4] - data[idx + 4] -
                data[idx - width * 4] - data[idx + width * 4]
            );
            
            sum += laplacian;
            sumSq += laplacian * laplacian;
            count++;
        }
    }
    
    const mean = sum / count;
    const variance = (sumSq / count) - (mean * mean);
    
    // Normalize to 0-1 (higher = more blur)
    return Math.min(variance / 1000, 1);
};

const isAllowedFileType = (file) => {
    if (!file || !file.type) return false;
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/webm'
    ];
    return allowedTypes.includes(file.type);
};

const analyzeSentiment = (text) => {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'love', 'best', 'happy', 'joy', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'hate', 'worst', 'sad', 'angry', 'awful', 'disgusting'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positive = words.filter(w => positiveWords.includes(w)).length;
    const negative = words.filter(w => negativeWords.includes(w)).length;
    
    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
};

const extractProblematicText = (text, label) => {
    // Extract sentences that triggered the detection
    const sentences = text.split(/[.!?]+/);
    
    // Simple keyword matching based on label
    const keywords = {
        toxicity: ['stupid', 'idiot', 'dumb', 'loser'],
        threat: ['kill', 'hurt', 'destroy', 'revenge'],
        insult: ['ugly', 'worthless', 'pathetic', 'useless'],
    };
    
    const labelKeywords = keywords[label.toLowerCase()] || [];
    
    for (const sentence of sentences) {
        if (labelKeywords.some(kw => sentence.toLowerCase().includes(kw))) {
            return sentence.trim();
        }
    }
    
    return text.substring(0, 100);
};

const parseSightengineResponse = (data) => {
    const result = {
        isSafe: true,
        safetyScore: 1.0,
        violations: [],
    };
    
    // Parse nudity results
    if (data.nudity) {
        if (data.nudity.raw >= 0.5 || data.nudity.partial >= 0.7) {
            result.isSafe = false;
            result.violations.push({
                type: 'NUDITY_API',
                score: Math.max(data.nudity.raw, data.nudity.partial),
                source: 'sightengine',
            });
        }
    }
    
    // Parse weapon/alcohol/drugs
    if (data.weapon && data.weapon > 0.5) {
        result.violations.push({ type: 'WEAPON', score: data.weapon, source: 'sightengine' });
    }
    
    if (data.alcohol && data.alcohol > 0.7) {
        result.violations.push({ type: 'ALCOHOL', score: data.alcohol, source: 'sightengine', severity: 'warning' });
    }
    
    if (data.drugs && data.drugs > 0.5) {
        result.violations.push({ type: 'DRUGS', score: data.drugs, source: 'sightengine' });
    }
    
    // Parse gore
    if (data.gore && data.gore.prob >= 0.3) {
        result.isSafe = false;
        result.violations.push({ type: 'GORE', score: data.gore.prob, source: 'sightengine' });
    }
    
    // Parse offensive content
    if (data.offensive && data.offensive.prob > 0.7) {
        result.violations.push({ type: 'OFFENSIVE', score: data.offensive.prob, source: 'sightengine' });
    }
    
    return result;
};

const generateSafetyHash = async (results) => {
    // Generate a hash representing the safety scan results
    const hashData = JSON.stringify({
        violations: results.violations.map(v => v.type),
        rating: results.contentRating,
        timestamp: results.scanTimestamp,
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashData.length; i++) {
        const char = hashData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16).padStart(16, '0');
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS - The Public API
// ═══════════════════════════════════════════════════════════════════════════════

export const ContentModerationService = {
    // Initialization
    initialize: initializeModerationModels,
    
    // Analysis functions
    analyzeImage: analyzeImageNSFW,
    analyzeImageQuality,
    analyzeText: analyzeTextToxicity,
    analyzeMisinformation,
    
    // Comprehensive scan
    performPurityScan,
    scanMediaFile,
    scanTextContent,
    
    // Enforcement
    recordViolation,
    
    // Configuration
    config: MODERATION_CONFIG,
};

export default ContentModerationService;
