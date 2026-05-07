import { useState, useCallback, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useCall = (conversationId = null, listenForIncoming = false) => {
    const { user, session } = useAuth();
    const [activeCall, setActiveCall] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callStatus, setCallStatus] = useState('idle');
    const [callType, setCallType] = useState(null);
    const [remoteUserId, setRemoteUserId] = useState(null);
    const [isInitiator, setIsInitiator] = useState(false);

    // Initiate a call
    const initiateCall = useCallback(async (recipientId, type = 'audio', convId = null) => {
        if (!user) return null;

        try {

            setCallStatus('calling');
            setCallType(type);
            setRemoteUserId(recipientId);
            setIsInitiator(true);

            const targetConvId = convId || conversationId;

            if (!targetConvId) {
                throw new Error('No conversation ID available for call');
            }

            // Create call record
            const response = await fetch(
                `${supabaseUrl}/rest/v1/calls`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        conversation_id: targetConvId,
                        caller_id: user.id,
                        receiver_id: recipientId,
                        call_type: type,
                        status: 'ringing',
                        started_at: new Date().toISOString()
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const [call] = await response.json();


            setActiveCall(call);
            playRingtone();

            return call;
        } catch (err) {
            console.error('Error initiating call:', err);
            setCallStatus('idle');
            setIsInitiator(false);
            return null;
        }
    }, [user, conversationId, session]);

    // Answer incoming call
    const answerCall = useCallback(async (callId, type = 'audio') => {
        try {


            // Set active call and type
            setActiveCall({ id: callId });
            setCallStatus('active');
            setCallType(type);
            setIsInitiator(false);

            // Update call status in database
            await supabase
                .from('calls')
                .update({ status: 'answered' })
                .eq('id', callId);

            stopRingtone();

        } catch (err) {
            console.error('Error answering call:', err);
        }
    }, []);

    // Decline incoming call
    const declineCall = useCallback(async (callId) => {
        try {


            await supabase
                .from('calls')
                .update({
                    status: 'rejected',
                    ended_at: new Date().toISOString()
                })
                .eq('id', callId);

            setIncomingCall(null);
            setCallStatus('idle');
            stopRingtone();
        } catch (err) {
            console.error('Error declining call:', err);
        }
    }, []);

    // End active call
    const endCall = useCallback(async () => {
        if (!activeCall) return;

        try {


            const endTime = new Date();
            const startTime = new Date(activeCall.started_at);
            const duration = Math.floor((endTime - startTime) / 1000);

            await supabase
                .from('calls')
                .update({
                    status: 'ended',
                    ended_at: endTime.toISOString(),
                    duration_seconds: duration
                })
                .eq('id', activeCall.id);

        } catch (err) {
            console.error('Error ending call:', err);
        } finally {
            // ALWAYS clear state, even if DB update fails
            setActiveCall(null);
            setCallStatus('idle');
            setCallType(null);
            setRemoteUserId(null);
            setIsInitiator(false);
            stopRingtone();
        }
    }, [activeCall]);



    // Ringtone helpers
    const playRingtone = () => {
        try {
            if (window.activeRingtone) {
                window.activeRingtone.play().catch(() => { });
                return;
            }

            const audio = new Audio('/sounds/ringtone.mp3');
            audio.loop = true;
            audio.volume = 0.5;
            audio.play().catch(err => {
                // Ignore NotSupportedError (missing file) to prevent console noise
                if (err.name !== 'NotSupportedError') {

                }
            });
            window.activeRingtone = audio;
        } catch (err) {
            // Ignore errors
        }
    };

    // Listen for incoming calls (if enabled)
    useEffect(() => {
        if (!user || !listenForIncoming) {
            if (!listenForIncoming) {

            }
            return;
        }



        const subscription = supabase
            .channel(`calls-${user.id}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${user.id}`
                },
                (payload) => {

                    setIncomingCall(payload.new);
                    playRingtone();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
            stopRingtone();
        };
    }, [user, listenForIncoming]);

    // Ringtone helpers
    const stopRingtone = () => {
        if (window.activeRingtone) {
            window.activeRingtone.pause();
            window.activeRingtone.currentTime = 0;
            window.activeRingtone = null;
        }
    };

    return {
        activeCall,
        incomingCall,
        callStatus,
        callType,
        isInitiator,
        initiateCall,
        answerCall,
        declineCall,
        endCall,
        // For compatibility
        localStream: null,
        remoteStream: null,
        isConnected: false,
        toggleAudio: () => { },
        toggleVideo: () => { },
        webRTCError: null
    };
};
