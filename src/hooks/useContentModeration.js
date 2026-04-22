// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ USE CONTENT MODERATION HOOK - Real-time Purity Gate
// ═══════════════════════════════════════════════════════════════════════════════
// Layer 1: Pre-upload AI scanning with TensorFlow.js
// Layer 2: Purpose-driven quality control
// Layer 3: Ruthless enforcement & feedback
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import { ContentModerationService } from '../services/ContentModerationService';

/**
 * Hook for comprehensive content moderation
 * Features:
 * - Real-time image NSFW detection (TensorFlow.js + NSFWJS)
 * - Text toxicity analysis
 * - Quality control (blur, brightness, resolution)
 * - Misinformation detection
 * - H2-themed progress UI
 */
export const useContentModeration = (options = {}) => {
    const {
        onViolation = null,
        onQualityIssue = null,
        onComplete = null,
        autoInitialize = true
    } = options;

    // State
    const [isInitializing, setIsInitializing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [modelsReady, setModelsReady] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStage, setScanStage] = useState(''); // 'idle', 'vision', 'text', 'quality', 'complete'
    const [lastResult, setLastResult] = useState(null);
    const [error, setError] = useState(null);
    
    // Refs for cancellation
    const abortController = useRef(null);
    const isMounted = useRef(true);

    /**
     * Initialize AI models on mount
     */
    useEffect(() => {
        if (autoInitialize) {
            initializeModels();
        }
        
        return () => {
            isMounted.current = false;
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, [autoInitialize]);

    /**
     * Initialize moderation models
     */
    const initializeModels = useCallback(async () => {
        if (isInitializing || modelsReady) return;
        
        setIsInitializing(true);
        setScanStage('initializing');
        
        try {
            await ContentModerationService.initialize();
            if (isMounted.current) {
                setModelsReady(true);
            }
        } catch (err) {
            console.error('[useContentModeration] Model init failed:', err);
            setError('Failed to initialize moderation models');
        } finally {
            if (isMounted.current) {
                setIsInitializing(false);
            }
        }
    }, [isInitializing, modelsReady]);

    /**
     * Perform complete purity scan on content
     * @param {Object} content - { mediaFiles: File[], caption: string, type: string }
     * @returns {Promise<Object>} Scan results
     */
    const performPurityScan = useCallback(async (content) => {
        abortController.current = new AbortController();
        
        setIsScanning(true);
        setScanProgress(0);
        setError(null);
        setScanStage('starting');
        
        const progressInterval = setInterval(() => {
            setScanProgress(prev => Math.min(prev + 2, 90));
        }, 100);
        
        try {
            // Stage 1: Vision Analysis
            if (content.mediaFiles?.length > 0) {
                setScanStage('analyzing_media');
            }
            
            // Stage 2: Text Analysis
            if (content.caption) {
                setScanStage('analyzing_text');
            }
            
            // Stage 3: Quality Check
            setScanStage('checking_quality');
            
            // Perform the scan
            const result = await ContentModerationService.performPurityScan(content);
            
            clearInterval(progressInterval);
            
            if (isMounted.current) {
                setScanProgress(100);
                setScanStage('complete');
                setLastResult(result);
                
                // Callbacks
                if (result.violations?.length > 0 && onViolation) {
                    onViolation(result.violations, result);
                }
                
                if (result.warnings?.length > 0 && onQualityIssue) {
                    onQualityIssue(result.warnings, result);
                }
                
                if (onComplete) {
                    onComplete(result);
                }
            }
            
            return result;
            
        } catch (err) {
            clearInterval(progressInterval);
            
            if (isMounted.current) {
                setError(err.message);
                setScanStage('error');
            }
            
            // Fail-safe: allow content if scan fails critically
            return {
                passed: true,
                error: err.message,
                contentRating: 0.5,
                safetyHash: null,
                failedOpen: true
            };
        } finally {
            if (isMounted.current) {
                setIsScanning(false);
            }
        }
    }, [onViolation, onQualityIssue, onComplete]);

    /**
     * Quick image scan (for previews)
     * @param {File} file
     * @returns {Promise<Object>} Quick scan result
     */
    const quickScanImage = useCallback(async (file) => {
        try {
            setScanStage('quick_scan');
            const result = await ContentModerationService.analyzeImage(file);
            return result;
        } catch (err) {
            console.error('[useContentModeration] Quick scan failed:', err);
            return { isSafe: true, safetyScore: 1, error: err.message };
        }
    }, []);

    /**
     * Scan text content only
     * @param {string} text
     * @returns {Promise<Object>} Text analysis result
     */
    const scanText = useCallback(async (text) => {
        try {
            setScanStage('scanning_text');
            const result = await ContentModerationService.analyzeText(text);
            return result;
        } catch (err) {
            console.error('[useContentModeration] Text scan failed:', err);
            return { isSafe: true, safetyScore: 1, error: err.message };
        }
    }, []);

    /**
     * Cancel ongoing scan
     */
    const cancelScan = useCallback(() => {
        if (abortController.current) {
            abortController.current.abort();
        }
        setIsScanning(false);
        setScanProgress(0);
        setScanStage('cancelled');
    }, []);

    /**
     * Clear results
     */
    const clearResult = useCallback(() => {
        setLastResult(null);
        setError(null);
        setScanProgress(0);
        setScanStage('idle');
    }, []);

    /**
     * Get human-readable scan stage label
     */
    const getScanStageLabel = useCallback(() => {
        const labels = {
            idle: '',
            initializing: 'Initializing AI guardians...',
            starting: 'Preparing scan...',
            analyzing_media: 'Analyzing media content...',
            analyzing_text: 'Checking text for toxicity...',
            checking_quality: 'Evaluating content quality...',
            complete: 'Scan complete',
            error: 'Scan failed',
            cancelled: 'Scan cancelled',
            quick_scan: 'Quick scanning...',
            scanning_text: 'Scanning text...'
        };
        return labels[scanStage] || 'Scanning...';
    }, [scanStage]);

    /**
     * Check if content would be blocked based on last result
     */
    const wouldBeBlocked = useCallback(() => {
        if (!lastResult) return false;
        return lastResult.blocked || (!lastResult.passed && lastResult.violations?.length > 0);
    }, [lastResult]);

    /**
     * Get violation summary for display
     */
    const getViolationSummary = useCallback(() => {
        if (!lastResult?.violations?.length) return null;
        
        const critical = lastResult.violations.filter(v => 
            ['NUDITY_PORN', 'NUDITY_HENTAI', 'VIOLENCE', 'THREAT'].includes(v.type)
        );
        
        const warnings = lastResult.violations.filter(v => 
            v.severity === 'warning' || v.type === 'SUGGESTIVE'
        );
        
        return {
            hasCritical: critical.length > 0,
            hasWarnings: warnings.length > 0,
            criticalCount: critical.length,
            warningCount: warnings.length,
            totalCount: lastResult.violations.length,
            violations: lastResult.violations
        };
    }, [lastResult]);

    return {
        // State
        isInitializing,
        isScanning,
        modelsReady,
        scanProgress,
        scanStage,
        scanStageLabel: getScanStageLabel(),
        lastResult,
        error,
        
        // Actions
        initializeModels,
        performPurityScan,
        quickScanImage,
        scanText,
        cancelScan,
        clearResult,
        
        // Utilities
        wouldBeBlocked: wouldBeBlocked(),
        violationSummary: getViolationSummary(),
        isConfigured: true, // Always configured with TensorFlow.js
        
        // Service reference
        service: ContentModerationService
    };
};

export default useContentModeration;
