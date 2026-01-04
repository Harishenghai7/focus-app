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
            console.log('🎤 Requesting media access...', audioOnly ? 'Audio only' : 'Audio + Video');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: !audioOnly
            });

            console.log('✅ Media access granted');
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
            console.log('📞 Starting call as initiator...', { callId, audioOnly });

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
                console.log('📡 Sending signal:', signal.type);

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
                console.log('📺 Received remote stream');
                setRemoteStream(stream);
            });

            // Handle connection
            newPeer.on('connect', () => {
                console.log('✅ Peer connected!');
                setIsConnected(true);
            });

            // Handle errors
            newPeer.on('error', (err) => {
                console.error('❌ Peer error:', err);
                setError(err.message);
            });

            // Handle close
            newPeer.on('close', () => {
                console.log('📴 Peer connection closed');
                setIsConnected(false);
            });

            peerRef.current = newPeer;
            setPeer(newPeer);

            console.log('✅ Peer initialized as initiator');
        } catch (err) {
            console.error('❌ Error starting call:', err);
            setError(err.message);
        }
    }, [userId, initializeMedia]);

    // Answer call as receiver
    const answerCall = useCallback(async (callId, audioOnly = true) => {
        try {
            console.log('📞 Answering call...', { callId, audioOnly });

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
                console.log('📡 Sending signal:', signal.type);

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
                console.log('📺 Received remote stream');
                setRemoteStream(stream);
            });

            // Handle connection
            newPeer.on('connect', () => {
                console.log('✅ Peer connected!');
                setIsConnected(true);
            });

            // Handle errors
            newPeer.on('error', (err) => {
                console.error('❌ Peer error:', err);
                setError(err.message);
            });

            // Handle close
            newPeer.on('close', () => {
                console.log('📴 Peer connection closed');
                setIsConnected(false);
            });

            peerRef.current = newPeer;
            setPeer(newPeer);

            console.log('✅ Peer initialized as receiver, waiting for offer...');
        } catch (err) {
            console.error('❌ Error answering call:', err);
            setError(err.message);
        }
    }, [userId, initializeMedia]);

    // Listen for incoming signals
    useEffect(() => {
        if (!userId || !conversationId) return;

        console.log('👂 Setting up signal listener...');

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

                    console.log('📨 Received signal from peer');

                    try {
                        const signal = JSON.parse(payload.new.signal);

                        if (peerRef.current) {
                            console.log('📡 Processing signal...');
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
            console.log('🧹 Cleaning up signal listener');
            channel.unsubscribe();
        };
    }, [userId, conversationId]);

    // End call
    const endCall = useCallback(() => {
        console.log('📴 Ending call...');

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

        console.log('✅ Call ended');
    }, [localStream]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                console.log('🔊 Audio:', audioTrack.enabled ? 'ON' : 'OFF');
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
                console.log('📹 Video:', videoTrack.enabled ? 'ON' : 'OFF');
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
