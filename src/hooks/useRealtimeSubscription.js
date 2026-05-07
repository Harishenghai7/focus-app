import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * A hook for managing Supabase Realtime subscriptions with a polling fallback.
 * @param {Object} config - Configuration object
 */
export const useRealtimeSubscription = (config) => {
    const {
        channelName,
        table,
        event = '*',
        schema = 'public',
        filter,
        onEvent,
        enabled = true,
        pollingFn,
        pollingInterval = 10000
    } = config;

    const channelRef = useRef(null);
    const onEventRef = useRef(onEvent);
    const pollingFnRef = useRef(pollingFn);

    // Keep refs updated to avoid re-subscriptions when callbacks change
    useEffect(() => {
        onEventRef.current = onEvent;
        pollingFnRef.current = pollingFn;
    }, [onEvent, pollingFn]);

    useEffect(() => {
        if (!enabled || !table) return;



        // 1. Realtime Subscription
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes',
                { event, schema, table, filter },
                (payload) => {

                    if (onEventRef.current) onEventRef.current(payload);
                }
            )
            .subscribe((status) => {

            });

        channelRef.current = channel;

        // 2. Polling Fallback
        let pollTimer;
        if (pollingFnRef.current) {


            // Initial poll
            pollingFnRef.current().catch(err => console.warn(`⚠️ Initial poll failed (${channelName}):`, err));

            pollTimer = setInterval(async () => {
                try {
                    if (pollingFnRef.current) {
                        await pollingFnRef.current();
                    }
                } catch (err) {
                    console.warn(`⚠️ Polling failed (${channelName}):`, err);
                }
            }, pollingInterval);
        }

        return () => {

            supabase.removeChannel(channel);
            if (pollTimer) clearInterval(pollTimer);
        };
    }, [channelName, table, event, schema, filter, enabled, pollingInterval]);

    return channelRef.current;
};
