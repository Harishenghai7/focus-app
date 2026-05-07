import { useState, useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { supabase } from '../lib/supabase';

/**
 * Simplified WebRTC hook using Simple-Peer library
 * Handles peer-to-peer audio/video connections with automatic signaling
 */
export const useSimplePeer = (userId, conversationId) => {
    const [peer, setPeer] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    const peerRef = useRef(null);
    const channelRef = useRef(null);

    // Initialize media stream
    const initializeMedia = useCallback(async (audioOnly = true) => {
        try {


            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: !audioOnly
            });


            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('❌ Media access error:', err);
            setError('Could not access microphone/camera');
            throw err;
        }
    }, []);

    // Start call as initiator (caller)
    const startCall = useCallback(async (callId, audioOnly = true) => {
        try {


            // Get media stream
            const stream = await initializeMedia(audioOnly);

            // Create peer as initiator
            const newPeer = new SimplePeer({
                initiator: true,
                stream: stream,
                trickle: true,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            // Handle signal (offer/answer/ice candidates)
            newPeer.on('signal', async (signal) => {


                // Send signal via Supabase
                await supabase
                    .from('webrtc_signals')
                    .insert({
                        call_id: callId,
                        from_user: userId,
                        signal: JSON.stringify(signal),
                        created_at: new Date().toISOString()
                    });
            });

            // Handle incoming stream
            newPeer.on('stream', (stream) => {

                setRemoteStream(stream);
            });

            // Handle connection
            newPeer.on('connect', () => {

                setIsConnected(true);
            });

            // Handle errors
            newPeer.on('error', (err) => {
                console.error('❌ Peer error:', err);
                setError(err.message);
            });

            // Handle close
            newPeer.on('close', () => {

                setIsConnected(false);
            });

            peerRef.current = newPeer;
            setPeer(newPeer);


        } catch (err) {
            console.error('❌ Error starting call:', err);
            setError(err.message);
        }
    }, [userId, initializeMedia]);

    // Answer call as receiver
    const answerCall = useCallback(async (callId, audioOnly = true) => {
        try {


            // Get media stream
            const stream = await initializeMedia(audioOnly);

            // Create peer as receiver (not initiator)
            const newPeer = new SimplePeer({
                initiator: false,
                stream: stream,
                trickle: true,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            // Handle signal (answer/ice candidates)
            newPeer.on('signal', async (signal) => {


                // Send signal via Supabase
                await supabase
                    .from('webrtc_signals')
                    .insert({
                        call_id: callId,
                        from_user: userId,
                        signal: JSON.stringify(signal),
                        created_at: new Date().toISOString()
                    });
            });

            // Handle incoming stream
            newPeer.on('stream', (stream) => {

                setRemoteStream(stream);
            });

            // Handle connection
            newPeer.on('connect', () => {

                setIsConnected(true);
            });

            // Handle errors
            newPeer.on('error', (err) => {
                console.error('❌ Peer error:', err);
                setError(err.message);
            });

            // Handle close
            newPeer.on('close', () => {

                setIsConnected(false);
            });

            peerRef.current = newPeer;
            setPeer(newPeer);


        } catch (err) {
            console.error('❌ Error answering call:', err);
            setError(err.message);
        }
    }, [userId, initializeMedia]);

    // Listen for incoming signals
    useEffect(() => {
        if (!userId || !conversationId) return;



        const channel = supabase
            .channel(`webrtc-signals-${conversationId}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'webrtc_signals',
                    filter: `call_id=eq.${conversationId}`
                },
                (payload) => {
                    // Ignore our own signals
                    if (payload.new.from_user === userId) return;



                    try {
                        const signal = JSON.parse(payload.new.signal);

                        if (peerRef.current) {

                            peerRef.current.signal(signal);
                        } else {
                            console.warn('⚠️ Received signal but peer not initialized');
                        }
                    } catch (err) {
                        console.error('❌ Error processing signal:', err);
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {

            channel.unsubscribe();
        };
    }, [userId, conversationId]);

    // End call
    const endCall = useCallback(() => {


        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        setRemoteStream(null);
        setIsConnected(false);
        setPeer(null);


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

    return {
        peer,
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
