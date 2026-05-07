import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for WebRTC peer-to-peer connections
 * Handles signaling via Supabase Realtime
 */
export const useWebRTC = (localUserId, remoteUserId, conversationId) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    const peerConnection = useRef(null);
    const signalingChannel = useRef(null);

    // ICE servers configuration (using free STUN/TURN servers)
    const iceServers = {
        iceServers: [
            // Google STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            // Free TURN server from Metered (no auth required for testing)
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ]
    };

    // Send signaling message via Supabase Realtime
    const sendSignal = useCallback(async (signal) => {
        try {
            const { error } = await supabase
                .from('call_signals')
                .insert({
                    conversation_id: conversationId,
                    from_user_id: signal.from,
                    to_user_id: signal.to,
                    signal_type: signal.type,
                    signal_data: signal
                });

            if (error) throw error;

        } catch (err) {
            console.error('❌ Error sending signal:', err);
        }
    }, [conversationId]);

    // Initialize peer connection
    const initializePeerConnection = useCallback(() => {
        try {
            peerConnection.current = new RTCPeerConnection(iceServers);

            // Handle ICE candidates
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {

                    sendSignal({
                        type: 'ice-candidate',
                        candidate: event.candidate,
                        from: localUserId,
                        to: remoteUserId
                    });
                }
            };

            // Handle remote stream
            peerConnection.current.ontrack = (event) => {

                setRemoteStream(event.streams[0]);
            };

            // Handle connection state changes
            peerConnection.current.onconnectionstatechange = () => {
                const state = peerConnection.current.connectionState;

                setIsConnected(state === 'connected');

                if (state === 'failed' || state === 'disconnected') {
                    setError('Connection failed or disconnected');
                }
            };


        } catch (err) {
            console.error('❌ Error initializing peer connection:', err);
            setError(err.message);
        }
    }, [localUserId, remoteUserId, sendSignal]);

    // Handle incoming signaling messages
    const handleSignal = useCallback(async (signal) => {


        try {
            switch (signal.type) {
                case 'offer':
                    await peerConnection.current.setRemoteDescription(
                        new RTCSessionDescription(signal.offer)
                    );
                    const answer = await peerConnection.current.createAnswer();
                    await peerConnection.current.setLocalDescription(answer);
                    sendSignal({
                        type: 'answer',
                        answer: answer,
                        from: localUserId,
                        to: remoteUserId
                    });
                    break;

                case 'answer':
                    await peerConnection.current.setRemoteDescription(
                        new RTCSessionDescription(signal.answer)
                    );
                    break;

                case 'ice-candidate':
                    await peerConnection.current.addIceCandidate(
                        new RTCIceCandidate(signal.candidate)
                    );
                    break;

                default:
                    console.warn('Unknown signal type:', signal.type);
            }
        } catch (err) {
            console.error('❌ Error handling signal:', err);
            setError(err.message);
        }
    }, [localUserId, remoteUserId, sendSignal]);

    // Start call (initiator)
    const startCall = useCallback(async (audioOnly = false) => {
        try {


            // Get local media stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: !audioOnly
            });

            setLocalStream(stream);

            // Initialize peer connection
            initializePeerConnection();

            // Add local tracks to peer connection
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
            });

            // Create and send offer
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            sendSignal({
                type: 'offer',
                offer: offer,
                from: localUserId,
                to: remoteUserId
            });


        } catch (err) {
            console.error('❌ Error starting call:', err);
            setError(err.message);
        }
    }, [localUserId, remoteUserId, initializePeerConnection, sendSignal]);

    // Answer call (receiver)
    const answerCall = useCallback(async (audioOnly = false) => {
        try {


            // Initialize peer connection if not already done
            if (!peerConnection.current) {
                initializePeerConnection();
            }

            // Get local media stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: !audioOnly
            });

            setLocalStream(stream);

            // Add local tracks to peer connection
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
            });


        } catch (err) {
            console.error('❌ Error answering call:', err);
            setError(err.message);
        }
    }, [initializePeerConnection]);

    // End call
    const endCall = useCallback(() => {


        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // Close peer connection
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        setRemoteStream(null);
        setIsConnected(false);

    }, [localStream]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }, [localStream]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }, [localStream]);

    // Set up signaling channel
    useEffect(() => {
        if (!conversationId || !localUserId) return;



        try {
            // Subscribe to call signals
            signalingChannel.current = supabase
                .channel(`call_${conversationId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'call_signals',
                    filter: `to_user_id=eq.${localUserId}`
                }, (payload) => {

                    handleSignal(payload.new.signal_data);
                })
                .subscribe((status) => {

                    if (status === 'SUBSCRIBED') {

                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Signaling channel error - table may not exist. Run create_calls_tables.sql migration.');
                    }
                });

            return () => {
                if (signalingChannel.current) {

                    signalingChannel.current.unsubscribe();
                }
            };
        } catch (err) {
            console.error('❌ Error setting up signaling channel:', err);
            console.error('💡 Make sure to run create_calls_tables.sql migration in Supabase');
        }
    }, [conversationId, localUserId, handleSignal]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            endCall();
        };
    }, [endCall]);

    return {
        localStream,
        remoteStream,
        isConnected,
        error,
        startCall,
        answerCall,
        endCall,
        toggleAudio,
        toggleVideo
    };
};
