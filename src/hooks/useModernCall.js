import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Modern WebRTC hook using Native RTCPeerConnection
 * Uses Hybrid Signaling: Database (Persistent) + Realtime Broadcast (Instant)
 */
export const useModernCall = (userId, callId) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [remoteEnded, setRemoteEnded] = useState(false);

    const peerRef = useRef(null);
    const localStreamRef = useRef(null);
    const iceCandidatesQueue = useRef([]);
    const channelRef = useRef(null);

    // ICE Servers configuration
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // Initialize media
    const initMedia = useCallback(async (audioOnly = true) => {
        try {
            console.log('🎤 Requesting media...', audioOnly ? 'Audio only' : 'Audio + Video');

            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: audioOnly ? false : {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Media granted');

            setLocalStream(stream);
            localStreamRef.current = stream;
            return stream;
        } catch (err) {
            console.error('❌ Media error:', err);

            if (!audioOnly && (err.name === 'NotReadableError' || err.name === 'NotAllowedError')) {
                console.log('⚠️ Video failed, falling back to audio only...');
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setLocalStream(audioStream);
                    localStreamRef.current = audioStream;
                    return audioStream;
                } catch (audioErr) {
                    setError('Could not access microphone');
                    throw audioErr;
                }
            }

            setError('Could not access camera/microphone');
            throw err;
        }
    }, []);

    // Helper to send signals via BOTH DB and Broadcast
    const sendSignal = useCallback(async (type, payload) => {
        if (!callId || !userId) return;

        const signalData = { type, ...payload };
        console.log(`📤 Sending signal (${type}) via Hybrid Channel...`);

        // 1. Send via Broadcast (Fast, Ephemeral)
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'signal',
                payload: { ...signalData, from_user: userId }
            }).catch(err => console.warn('⚠️ Broadcast failed:', err));
        }

        // 2. Send via Database (Persistent, Reliable)
        // Don't await this if it's just a candidate or ready signal to avoid blocking
        const dbPromise = supabase.from('webrtc_signals').insert({
            call_id: callId,
            from_user: userId,
            signal: JSON.stringify(signalData)
        });

        if (type === 'offer' || type === 'answer') {
            // For critical signals, we log errors but don't block execution
            dbPromise.then(({ error }) => {
                if (error) console.error(`❌ DB Insert Error (${type}):`, error);
                else console.log(`✅ DB Insert Success (${type})`);
            });
        }
    }, [callId, userId]);

    // Create Peer Connection
    const createPeerConnection = useCallback((userId, callId) => {
        const pc = new RTCPeerConnection(rtcConfig);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('❄️ New ICE candidate generated');
                sendSignal('candidate', { candidate: event.candidate });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('🔄 Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setIsConnected(true);
                setIsConnecting(false);
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                setIsConnected(false);
                setIsConnecting(false);
            }
        };

        pc.ontrack = (event) => {
            console.log('📺 Received remote track');
            setRemoteStream(event.streams[0]);
        };

        return pc;
    }, [sendSignal]);

    // Start call as initiator
    const startCall = useCallback(async (audioOnly = true) => {
        if (!callId || !userId) return;

        try {
            setIsConnecting(true);
            console.log('📞 Starting call as initiator...');

            const stream = await initMedia(audioOnly);
            const pc = createPeerConnection(userId, callId);

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            console.log('📡 Sending offer...');
            sendSignal('offer', { sdp: offer });

            peerRef.current = pc;
        } catch (err) {
            console.error('❌ Start call error:', err);
            setIsConnecting(false);
        }
    }, [callId, userId, initMedia, createPeerConnection, sendSignal]);

    // Answer call as receiver
    const answerCall = useCallback(async (audioOnly = true) => {
        if (!callId || !userId) return;

        try {
            setIsConnecting(true);
            console.log('📞 Answering call...');

            const stream = await initMedia(audioOnly);
            const pc = createPeerConnection(userId, callId);

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            peerRef.current = pc;

            if (iceCandidatesQueue.current.length > 0) {
                console.log('❄️ Processing queued candidates:', iceCandidatesQueue.current.length);
                for (const candidate of iceCandidatesQueue.current) {
                    await pc.addIceCandidate(candidate);
                }
                iceCandidatesQueue.current = [];
            }

            console.log('👋 Sending READY signal...');
            sendSignal('ready', {});

            // Start Polling for Offer (Backup)
            console.log('🔄 Starting offer polling...');
            const pollInterval = setInterval(async () => {
                if (peerRef.current && peerRef.current.remoteDescription) {
                    clearInterval(pollInterval);
                    return;
                }

                try {
                    const { data: offers } = await supabase
                        .from('webrtc_signals')
                        .select('signal, from_user')
                        .eq('call_id', callId)
                        .order('created_at', { ascending: true });

                    if (offers && offers.length > 0) {
                        for (const row of offers) {
                            if (row.from_user === userId) continue;
                            const signal = JSON.parse(row.signal);
                            if (signal.type === 'offer') {
                                console.log('📜 Polling found OFFER:', signal);
                                if (peerRef.current && !peerRef.current.remoteDescription) {
                                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                                    const answer = await pc.createAnswer();
                                    await pc.setLocalDescription(answer);
                                    sendSignal('answer', { sdp: answer });
                                    clearInterval(pollInterval);
                                }
                                break;
                            }
                        }
                    }
                } catch (err) {
                    // Ignore polling errors
                }
            }, 2000);

            setTimeout(() => clearInterval(pollInterval), 30000);

        } catch (err) {
            console.error('❌ Answer call error:', err);
            setIsConnecting(false);
        }
    }, [callId, userId, initMedia, createPeerConnection, sendSignal]);

    // Listen for signals (Broadcast + DB)
    useEffect(() => {
        if (!callId || !userId) return;

        console.log('👂 Listening for signals...', callId);

        const handleSignal = async (signal, fromUser) => {
            if (fromUser === userId) return;
            console.log('📨 Received signal:', signal.type);

            try {
                const pc = peerRef.current;

                if (signal.type === 'offer') {
                    if (!pc) {
                        console.log('⚠️ Received offer but peer not ready');
                        return;
                    }
                    if (pc.remoteDescription) return; // Already handled

                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    sendSignal('answer', { sdp: answer });
                }
                else if (signal.type === 'answer') {
                    if (pc && !pc.remoteDescription) {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    }
                }
                else if (signal.type === 'candidate') {
                    if (pc && pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    } else {
                        iceCandidatesQueue.current.push(new RTCIceCandidate(signal.candidate));
                    }
                }
                else if (signal.type === 'ready') {
                    console.log('👋 Peer is ready, re-sending offer...');
                    if (pc && pc.localDescription && pc.localDescription.type === 'offer') {
                        console.log('📡 Re-sending offer to ready peer...');
                        sendSignal('offer', { sdp: pc.localDescription });
                    }
                }
                else if (signal.type === 'end') {
                    console.log('👋 Peer ended the call');
                    setRemoteEnded(true);

                    if (peerRef.current) {
                        peerRef.current.close();
                        peerRef.current = null;
                    }
                    setIsConnected(false);
                }
            } catch (err) {
                console.error('❌ Signal processing error:', err);
            }
        };

        const channel = supabase.channel(`webrtc-${callId}`, {
            config: {
                broadcast: { self: false }
            }
        });

        channel
            .on('broadcast', { event: 'signal' }, ({ payload }) => {
                handleSignal(payload, payload.from_user);
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'webrtc_signals',
                filter: `call_id=eq.${callId}`
            }, (payload) => {
                const signal = JSON.parse(payload.new.signal);
                handleSignal(signal, payload.new.from_user);
            })
            .subscribe((status) => {
                console.log('📡 Channel status:', status);
                if (status === 'SUBSCRIBED') {
                    channelRef.current = channel;
                }
            });

        // Listen for Call Status Changes (e.g. Rejected, Ended)
        const statusChannel = supabase.channel(`call-status-${callId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'calls',
                filter: `id=eq.${callId}`
            }, (payload) => {
                const newStatus = payload.new.status;
                console.log('📞 Call status changed:', newStatus);

                if (newStatus === 'rejected' || newStatus === 'ended') {
                    console.log('🚫 Call was rejected or ended remotely');
                    setRemoteEnded(true);
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
            statusChannel.unsubscribe();
            channelRef.current = null;
        };
    }, [callId, userId, sendSignal]);

    // End call
    const endCall = useCallback(async () => {
        console.log('📴 Ending call...');

        // Send end signal if we are connected or connecting
        if (isConnected || isConnecting) {
            console.log('📤 Sending END signal...');
            await sendSignal('end', {});
        }

        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnected(false);
        setIsConnecting(false);
    }, [isConnected, isConnecting, sendSignal]);

    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                return !audioTrack.enabled;
            }
        }
        return false;
    }, []);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
                return !videoTrack.enabled;
            }
        }
        return false;
    }, []);

    return {
        localStream,
        remoteStream,
        isConnected,
        isConnecting,
        isMuted,
        isVideoOff,
        error,
        remoteEnded,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleVideo
    };
};
