import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook for managing screen time tracking and limits
 */
export const useScreenTime = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [limits, setLimits] = useState(null);
    const [todayUsage, setTodayUsage] = useState(0);
    const [isLimitExceeded, setIsLimitExceeded] = useState(false);
    const [isTimeBlocked, setIsTimeBlocked] = useState(false);
    const [currentBlock, setCurrentBlock] = useState(null);
    const [remainingMinutes, setRemainingMinutes] = useState(null);
    const [graceActive, setGraceActive] = useState(false);

    const sessionStart = useRef(null);
    const trackingInterval = useRef(null);

    // Check if current time is in a blocked period
    const checkTimeBlocks = useCallback((blocks) => {
        if (!blocks || blocks.length === 0) return null;

        const now = new Date();
        const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

        for (const block of blocks) {
            if (!block.days.includes(currentDay)) continue;

            const [startHour, startMin] = block.start.split(':').map(Number);
            const [endHour, endMin] = block.end.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            let endMinutes = endHour * 60 + endMin;

            // Handle overnight blocks (e.g., 22:00 to 07:00)
            if (endMinutes < startMinutes) {
                if (currentTime >= startMinutes || currentTime < endMinutes) {
                    return block;
                }
            } else {
                if (currentTime >= startMinutes && currentTime < endMinutes) {
                    return block;
                }
            }
        }

        return null;
    }, []);

    // Fetch screen time data
    const fetchScreenTimeData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Get limits
            const { data: limitsData } = await supabase
                .from('screen_time_limits')
                .select('*')
                .eq('teen_id', user.id)
                .eq('enabled', true)
                .single();

            setLimits(limitsData);

            // Get today's usage
            const today = new Date().toISOString().split('T')[0];
            const { data: usageData } = await supabase
                .from('screen_time_usage')
                .select('*')
                .eq('teen_id', user.id)
                .eq('date', today)
                .single();

            const usedMinutes = usageData?.total_minutes || 0;
            setTodayUsage(usedMinutes);

            // Check limits
            if (limitsData) {
                const isWeekend = [0, 6].includes(new Date().getDay());
                const dailyLimit = isWeekend
                    ? (limitsData.weekend_limit_minutes || limitsData.daily_limit_minutes)
                    : limitsData.daily_limit_minutes;

                const remaining = dailyLimit - usedMinutes;
                setRemainingMinutes(Math.max(0, remaining));

                // Check if in grace period
                if (remaining <= 0) {
                    if (remaining > -limitsData.grace_period_minutes) {
                        setGraceActive(true);
                        setIsLimitExceeded(false);
                    } else {
                        setGraceActive(false);
                        setIsLimitExceeded(true);
                    }
                } else if (remaining <= limitsData.grace_period_minutes) {
                    setGraceActive(true);
                    setIsLimitExceeded(false);
                } else {
                    setGraceActive(false);
                    setIsLimitExceeded(false);
                }

                // Check time blocks
                const blocked = checkTimeBlocks(limitsData.time_blocks);
                setIsTimeBlocked(!!blocked);
                setCurrentBlock(blocked);
            }
        } catch (err) {
            console.error('Error fetching screen time data:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, checkTimeBlocks]);

    // Start tracking session
    const startSession = useCallback(() => {
        if (sessionStart.current) return;

        sessionStart.current = new Date();

        // Update usage every minute
        trackingInterval.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - sessionStart.current.getTime()) / 60000);
            updateUsage(elapsed);
        }, 60000); // Every minute
    }, []);

    // End tracking session
    const endSession = useCallback(async () => {
        if (!sessionStart.current) return;

        const elapsed = Math.floor((Date.now() - sessionStart.current.getTime()) / 60000);

        if (trackingInterval.current) {
            clearInterval(trackingInterval.current);
            trackingInterval.current = null;
        }

        sessionStart.current = null;

        await updateUsage(elapsed);
    }, []);

    // Update usage in database
    const updateUsage = useCallback(async (additionalMinutes = 0) => {
        if (!user?.id) return;

        const today = new Date().toISOString().split('T')[0];

        try {
            // Get current usage
            const { data: current } = await supabase
                .from('screen_time_usage')
                .select('total_minutes')
                .eq('teen_id', user.id)
                .eq('date', today)
                .single();

            const newTotal = (current?.total_minutes || 0) + additionalMinutes;

            await supabase
                .from('screen_time_usage')
                .upsert({
                    teen_id: user.id,
                    date: today,
                    total_minutes: newTotal
                }, {
                    onConflict: 'teen_id,date'
                });

            setTodayUsage(newTotal);

            // Check if limit exceeded
            if (limits) {
                const isWeekend = [0, 6].includes(new Date().getDay());
                const dailyLimit = isWeekend
                    ? (limits.weekend_limit_minutes || limits.daily_limit_minutes)
                    : limits.daily_limit_minutes;

                if (newTotal >= dailyLimit) {
                    setIsLimitExceeded(true);
                    setRemainingMinutes(0);
                } else {
                    setRemainingMinutes(dailyLimit - newTotal);
                }
            }
        } catch (err) {
            console.error('Error updating screen time:', err);
        }
    }, [user?.id, limits]);

    // Format time display
    const formatTime = useCallback((minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }, []);

    // Get status message
    const getStatusMessage = useCallback(() => {
        if (isTimeBlocked && currentBlock) {
            return {
                type: 'blocked',
                title: currentBlock.name || 'Blocked Time',
                message: `App is blocked until ${currentBlock.end}`
            };
        }

        if (isLimitExceeded) {
            return {
                type: 'exceeded',
                title: "Time's Up!",
                message: "You've reached your daily screen time limit"
            };
        }

        if (graceActive) {
            return {
                type: 'grace',
                title: 'Almost Time',
                message: `${formatTime(remainingMinutes)} remaining in grace period`
            };
        }

        if (remainingMinutes !== null && remainingMinutes <= 15) {
            return {
                type: 'warning',
                title: 'Time Running Low',
                message: `Only ${formatTime(remainingMinutes)} left today`
            };
        }

        return null;
    }, [isTimeBlocked, currentBlock, isLimitExceeded, graceActive, remainingMinutes, formatTime]);

    // Initialize
    useEffect(() => {
        fetchScreenTimeData();

        // Refresh every 5 minutes
        const refreshInterval = setInterval(fetchScreenTimeData, 300000);

        return () => {
            clearInterval(refreshInterval);
            if (trackingInterval.current) {
                clearInterval(trackingInterval.current);
            }
        };
    }, [fetchScreenTimeData]);

    // Track visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                endSession();
            } else {
                startSession();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Start session on mount
        if (!document.hidden) {
            startSession();
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            endSession();
        };
    }, [startSession, endSession]);

    return {
        loading,
        limits,
        todayUsage,
        remainingMinutes,
        isLimitExceeded,
        isTimeBlocked,
        currentBlock,
        graceActive,
        formatTime,
        getStatusMessage,
        refresh: fetchScreenTimeData
    };
};

export default useScreenTime;
