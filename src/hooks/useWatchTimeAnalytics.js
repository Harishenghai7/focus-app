/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * useWatchTimeAnalytics — GOD-LEVEL | H2 Royal Lavender
 * Watch Time Tracking for Explore Trending Algorithm
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * THE RELEVANCE SCORE FORMULA:
 * $$RelevanceScore = (\frac{WatchTime}{TotalDuration} \times 0.7) + (EngagementCount \times 0.3)$$
 *
 * Features:
 * - Tracks actual watch time vs total duration
 * - Calculates completion rate for relevance scoring
 * - Feeds data to Explore trending algorithm via Supabase
 * - Silent operation (never blocks user experience)
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Silent logger - don't spam console with analytics errors
const isSilentError = (err) => /does not exist|Could not find the table|42P01|PGRST205|403|Forbidden|violates row|RLS|permission denied/i.test(
    `${err?.message || ''}${err?.code || ''}${err?.status || ''}`
);

export const useWatchTimeAnalytics = (boltzId, isActive, videoRef) => {
    const watchStartTime = useRef(null);
    const totalWatchTime = useRef(0);
    const lastReportedTime = useRef(0);
    const videoDuration = useRef(0);
    const engagementCount = useRef(0);
    const hasCompleted = useRef(false);
    const reportInterval = useRef(null);

    // Calculate relevance score
    const calculateRelevanceScore = useCallback((watchTime, duration, engagements) => {
        if (!duration || duration <= 0) return 0;

        const completionRate = Math.min(watchTime / duration, 1);
        const watchTimeWeight = completionRate * 0.7;
        const engagementWeight = Math.min(engagements / 10, 1) * 0.3;

        return (watchTimeWeight + engagementWeight) * 100;
    }, []);

    // Report analytics to Supabase (silent, non-blocking)
    const reportAnalytics = useCallback(async () => {
        if (!boltzId || totalWatchTime.current === lastReportedTime.current) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            const relevanceScore = calculateRelevanceScore(
                totalWatchTime.current,
                videoDuration.current,
                engagementCount.current
            );

            // Silently report to analytics table (if exists)
            try {
                await supabase.from('boltz_analytics').upsert({
                    boltz_id: boltzId,
                    user_id: user.id,
                    watch_time_seconds: Math.floor(totalWatchTime.current),
                    video_duration_seconds: Math.floor(videoDuration.current),
                    completion_rate: videoDuration.current > 0
                        ? Math.min(totalWatchTime.current / videoDuration.current, 1)
                        : 0,
                    engagement_count: engagementCount.current,
                    relevance_score: relevanceScore,
                    has_completed: hasCompleted.current,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'boltz_id,user_id'
                });
            } catch (tableErr) {
                // Silent fail - table might not exist
                if (!isSilentError(tableErr)) {
                    console.warn('[WatchTimeAnalytics] Table error:', tableErr.message);
                }
            }

            // Also update the boltz trending score via RPC (if available)
            try {
                await supabase.rpc('update_boltz_relevance_score', {
                    p_boltz_id: boltzId,
                    p_watch_time: totalWatchTime.current,
                    p_duration: videoDuration.current,
                    p_engagements: engagementCount.current
                });
            } catch (rpcErr) {
                // Silent fail - RPC might not exist
            }

            lastReportedTime.current = totalWatchTime.current;
        } catch (error) {
            // Silent fail - analytics are non-critical
        }
    }, [boltzId, calculateRelevanceScore]);

    // Track engagement (like, comment, share, save)
    const trackEngagement = useCallback((type) => {
        engagementCount.current += 1;

        // Immediate report on engagement
        reportAnalytics();

        // Also track specific engagement type if available
        try {
            supabase.from('boltz_engagements').insert({
                boltz_id: boltzId,
                engagement_type: type,
                created_at: new Date().toISOString()
            }).catch(() => {}); // Silent fail
        } catch {}
    }, [boltzId, reportAnalytics]);

    // Mark video as completed
    const markCompleted = useCallback(() => {
        if (!hasCompleted.current) {
            hasCompleted.current = true;
            reportAnalytics();
        }
    }, [reportAnalytics]);

    // Watch time tracking effect
    useEffect(() => {
        if (isActive && boltzId) {
            // Start watching
            watchStartTime.current = Date.now();
            hasCompleted.current = false;

            // Get video duration if available
            if (videoRef?.current) {
                videoDuration.current = videoRef.current.duration || 0;

                // Listen for duration change (for dynamic duration videos)
                const handleDurationChange = () => {
                    videoDuration.current = videoRef.current.duration || 0;
                };

                // Listen for video end
                const handleEnded = () => {
                    markCompleted();
                };

                videoRef.current.addEventListener('durationchange', handleDurationChange);
                videoRef.current.addEventListener('ended', handleEnded);

                // Set up periodic reporting (every 10 seconds)
                reportInterval.current = setInterval(reportAnalytics, 10000);

                return () => {
                    videoRef.current?.removeEventListener('durationchange', handleDurationChange);
                    videoRef.current?.removeEventListener('ended', handleEnded);
                    clearInterval(reportInterval.current);

                    // Calculate final watch time
                    if (watchStartTime.current) {
                        const sessionTime = (Date.now() - watchStartTime.current) / 1000;
                        totalWatchTime.current += sessionTime;
                        watchStartTime.current = null;
                    }

                    // Final report
                    reportAnalytics();
                };
            }
        } else {
            // Pause watching
            if (watchStartTime.current) {
                const sessionTime = (Date.now() - watchStartTime.current) / 1000;
                totalWatchTime.current += sessionTime;
                watchStartTime.current = null;
            }
        }
    }, [isActive, boltzId, videoRef, markCompleted, reportAnalytics]);

    // Reset analytics when boltz changes
    useEffect(() => {
        totalWatchTime.current = 0;
        lastReportedTime.current = 0;
        engagementCount.current = 0;
        hasCompleted.current = false;
        videoDuration.current = 0;
    }, [boltzId]);

    return {
        trackEngagement,
        markCompleted,
        getAnalytics: () => ({
            watchTime: totalWatchTime.current,
            duration: videoDuration.current,
            completionRate: videoDuration.current > 0
                ? Math.min(totalWatchTime.current / videoDuration.current, 1)
                : 0,
            engagementCount: engagementCount.current,
            relevanceScore: calculateRelevanceScore(
                totalWatchTime.current,
                videoDuration.current,
                engagementCount.current
            ),
            hasCompleted: hasCompleted.current
        })
    };
};

export default useWatchTimeAnalytics;
