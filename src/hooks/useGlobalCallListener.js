import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Global hook to listen for incoming calls from anywhere in the app
 */
export const useGlobalCallListener = () => {
    const { user, session } = useAuth();
    const [incomingCall, setIncomingCall] = useState(null);

    useEffect(() => {
        if (!user?.id) return;

        console.log('🌍 Setting up GLOBAL call listener for user:', user.id);

        // 1. Realtime Subscription
        const subscription = supabase
            .channel(`global-calls-${user.id}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${user.id}`
                },
                (payload) => handleIncomingCall(payload.new)
            )
            .subscribe((status) => {
                console.log('🌍 Global call listener status:', status);
            });

        // 2. Polling Fallback (Every 5s)
        const pollInterval = setInterval(async () => {
            try {
                // Check for any 'ringing' calls for me created in the last 10 seconds
                // (To avoid picking up old stuck calls)
                const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

                const { data, error } = await supabase
                    .from('calls')
                    .select('*')
                    .eq('receiver_id', user.id)
                    .eq('status', 'ringing')
                    .gt('created_at', tenSecondsAgo)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (data && data.length > 0) {
                    const call = data[0];
                    // Only trigger if we aren't already ringing for this call
                    setIncomingCall(prev => {
                        if (prev && prev.id === call.id) return prev;
                        console.log('🔄 Polling found incoming call:', call);
                        handleIncomingCall(call);
                        return call; // This doesn't actually set state, handleIncomingCall does
                    });
                }
            } catch (err) {
                // Silent error for polling
            }
        }, 5000);

        return () => {
            console.log('🌍 Cleaning up global call listener');
            subscription.unsubscribe();
            clearInterval(pollInterval);
            stopRingtone();
        };
    }, [user?.id, session]);

    const handleIncomingCall = async (callRecord) => {
        try {
            console.log('🔔 GLOBAL: Incoming call detected!', callRecord);

            // Check if we already have this call
            // (Prevent duplicate processing from Realtime + Polling)
            if (incomingCall && incomingCall.id === callRecord.id) return;

            // Fetch caller details using direct REST API
            console.log('🔍 GLOBAL: Fetching caller profile via REST API...');

            let caller = null;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(
                    `${supabaseUrl}/rest/v1/profiles?id=eq.${callRecord.caller_id}&select=id,username,full_name,avatar_url`,
                    {
                        headers: {
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal
                    }
                );

                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        caller = data[0];
                        console.log('✅ GLOBAL: Profile fetched successfully:', caller);
                    }
                }
            } catch (fetchError) {
                console.warn('⚠️ GLOBAL: Profile fetch failed:', fetchError.message);
            }

            // Use fetched caller or fallback
            const callData = {
                ...callRecord,
                caller: caller || {
                    id: callRecord.caller_id,
                    username: 'Unknown User',
                    full_name: 'Unknown User',
                    avatar_url: null
                }
            };

            console.log('📲 GLOBAL: Setting incoming call:', callData);
            setIncomingCall(callData);
            playRingtone();
        } catch (err) {
            console.error('❌ GLOBAL: Error in call listener:', err);
        }
    };

    const acceptCall = async () => {
        console.log('🔘 ACCEPT BUTTON CLICKED!');

        if (!incomingCall) {
            console.error('❌ No incoming call!');
            return null;
        }

        console.log('📞 Accepting call:', incomingCall.id);
        console.log('📞 Conversation:', incomingCall.conversation_id);

        try {
            console.log('💾 Updating call status...');

            const response = await fetch(
                `${supabaseUrl}/rest/v1/calls?id=eq.${incomingCall.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'answered' })
                }
            );

            console.log('📥 Update response:', response.status);

            if (response.ok) {
                console.log('✅ Call status updated!');
            } else {
                const errorText = await response.text();
                console.error('❌ Update failed:', response.status, errorText);
            }
        } catch (err) {
            console.error('❌ Error updating call:', err);
        }

        const callData = { ...incomingCall };

        // Store call data in localStorage so ChatPane can pick it up
        console.log('💾 Storing call data in localStorage...');
        localStorage.setItem('pendingCall', JSON.stringify({
            ...callData,
            role: 'receiver',
            timestamp: Date.now()
        }));

        setIncomingCall(null);
        stopRingtone();

        // Navigate to conversation
        if (incomingCall.conversation_id) {
            console.log('🧭 Navigating to:', `/messages/${incomingCall.conversation_id}`);
            window.location.href = `/messages/${incomingCall.conversation_id}`;
        } else {
            console.warn('⚠️ No conversation_id!');
        }

        return callData;
    };

    const declineCall = async () => {
        console.log('🔘 DECLINE BUTTON CLICKED!');

        if (!incomingCall) return;

        console.log('❌ Declining call:', incomingCall.id);

        try {
            const response = await fetch(
                `${supabaseUrl}/rest/v1/calls?id=eq.${incomingCall.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'rejected',
                        ended_at: new Date().toISOString()
                    })
                }
            );

            if (response.ok) {
                console.log('✅ Call declined successfully');
            } else {
                const errorText = await response.text();
                console.error('❌ Decline failed:', response.status, errorText);
            }
        } catch (err) {
            console.error('❌ Error declining call:', err);
        }

        setIncomingCall(null);
        stopRingtone();
    };

    return {
        incomingCall,
        acceptCall,
        declineCall
    };
};

// Ringtone helpers
const playRingtone = () => {
    try {
        if (window.globalRingtone) {
            window.globalRingtone.play();
            return;
        }

        const audio = new Audio('/sounds/ringtone.mp3');
        audio.loop = true;
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Ringtone play failed:', err));
        window.globalRingtone = audio;
    } catch (err) {
        console.error('Error playing ringtone:', err);
    }
};

const stopRingtone = () => {
    if (window.globalRingtone) {
        window.globalRingtone.pause();
        window.globalRingtone.currentTime = 0;
        window.globalRingtone = null;
    }
};
