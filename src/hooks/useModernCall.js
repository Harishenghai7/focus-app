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
    const [videoDowngraded, setVideoDowngraded] = useState(false);
    // Screen sharing state
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const screenStreamRef = useRef(null);
    // Connection quality: 'excellent' | 'good' | 'poor' | 'critical'
    const [connectionQuality, setConnectionQuality] = useState('unknown');
    const [qualityStats, setQualityStats] = useState({ rtt: 0, packetLoss: 0, bandwidth: 0, jitter: 0 });
    // Call reactions
    const [incomingReactions, setIncomingReactions] = useState([]);

    const peerRef = useRef(null);
    const localStreamRef = useRef(null);
    const iceCandidatesQueue = useRef([]);
    const channelRef = useRef(null);
    const statsMonitorRef = useRef(null);

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
            console.info('[Call] Requesting media', { audioOnly });

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
            console.info('[Call] Media granted');

            setLocalStream(stream);
            localStreamRef.current = stream;
            return stream;
        } catch (err) {
            console.error('[Call] Media error:', err);

            if (!audioOnly && (err.name === 'NotReadableError' || err.name === 'NotAllowedError')) {
                console.warn('[Call] Video failed, falling back to audio only');
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
        console.info('[Call] Sending signal', { type, callId });

        // 1. Send via Broadcast (Fast, Ephemeral)
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'signal',
                payload: { ...signalData, from_user: userId }
            }).catch(err => console.warn('[Call] Broadcast failed:', err));
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
                if (error) console.error(`[Call] DB insert error (${type}):`, error);
            });
        }
    }, [callId, userId]);

    // Create Peer Connection
    const createPeerConnection = useCallback((userId, callId) => {
        const pc = new RTCPeerConnection(rtcConfig);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal('candidate', { candidate: event.candidate });
            }
        };

        pc.onconnectionstatechange = () => {
            console.info('[Call] Connection state', { state: pc.connectionState });
            if (pc.connectionState === 'connected') {
                setIsConnected(true);
                setIsConnecting(false);
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                setIsConnected(false);
                setIsConnecting(false);
            }
        };

        pc.ontrack = (event) => {
            console.info('[Call] Received remote track');
            setRemoteStream(event.streams[0]);
        };

        return pc;
    }, [sendSignal]);

    // Start call as initiator
    const startCall = useCallback(async (audioOnly = true) => {
        if (!callId || !userId) return;

        try {
            setIsConnecting(true);
            console.info('[Call] Starting call as initiator', { callId, audioOnly });

            const stream = await initMedia(audioOnly);
            const pc = createPeerConnection(userId, callId);

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            sendSignal('offer', { sdp: offer });

            peerRef.current = pc;
        } catch (err) {
            console.error('[Call] Start call error:', err);
            setIsConnecting(false);
        }
    }, [callId, userId, initMedia, createPeerConnection, sendSignal]);

    // Answer call as receiver
    const answerCall = useCallback(async (audioOnly = true) => {
        if (!callId || !userId) return;

        try {
            setIsConnecting(true);
            console.info('[Call] Answering call', { callId, audioOnly });

            const stream = await initMedia(audioOnly);
            const pc = createPeerConnection(userId, callId);

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            peerRef.current = pc;

            if (iceCandidatesQueue.current.length > 0) {
                console.info('[Call] Processing queued ICE candidates', { count: iceCandidatesQueue.current.length });
                for (const candidate of iceCandidatesQueue.current) {
                    await pc.addIceCandidate(candidate);
                }
                iceCandidatesQueue.current = [];
            }

            sendSignal('ready', {});

            // Start Polling for Offer (Backup)
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
            console.error('[Call] Answer call error:', err);
            setIsConnecting(false);
        }
    }, [callId, userId, initMedia, createPeerConnection, sendSignal]);

    // Listen for signals (Broadcast + DB)
    useEffect(() => {
        if (!callId || !userId) return;

        console.info('[Call] Listening for signals', { callId });

        const handleSignal = async (signal, fromUser) => {
            if (fromUser === userId) return;
            console.info('[Call] Received signal', { type: signal.type });

            try {
                const pc = peerRef.current;

                if (signal.type === 'offer') {
                    if (!pc) {
                        console.warn('[Call] Received offer but peer not ready');
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
                    if (pc && pc.localDescription && pc.localDescription.type === 'offer') {
                        sendSignal('offer', { sdp: pc.localDescription });
                    }
                }
                else if (signal.type === 'reaction') {
                    const reaction = { id: Date.now(), emoji: signal.emoji, timestamp: Date.now() };
                    setIncomingReactions(prev => [...prev, reaction]);
                    setTimeout(() => {
                        setIncomingReactions(prev => prev.filter(r => r.id !== reaction.id));
                    }, 3000);
                }
                else if (signal.type === 'end') {
                    console.info('[Call] Peer ended the call');
                    setRemoteEnded(true);

                    if (peerRef.current) {
                        peerRef.current.close();
                        peerRef.current = null;
                    }
                    setIsConnected(false);
                }
            } catch (err) {
                console.error('[Call] Signal processing error:', err);
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
                console.info('[Call] Channel status', { status });
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
                console.info('[Call] Call status changed', { status: newStatus });

                if (newStatus === 'rejected' || newStatus === 'ended') {
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

    // ───────────────────────────────────────────────────────────────────
    // Adaptive bitrate monitor — auto-downgrade to "High-Fidelity Audio Only"
    // when the outbound video link is starved. Does NOT drop the call.
    // ───────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isConnected) return;
        if (videoDowngraded) return;
        const stream = localStreamRef.current;
        const pc = peerRef.current;
        if (!stream || !pc) return;
        const hasVideo = stream.getVideoTracks().some(t => t.enabled);
        if (!hasVideo) return;

        let prevBytes = 0;
        let prevTs = 0;
        let weakStreaks = 0;
        const THRESHOLD_KBPS = 80;       // Below this we consider the link weak.
        const WEAK_STREAK_LIMIT = 2;     // Two consecutive weak windows → downgrade.

        const tick = async () => {
            try {
                const stats = await pc.getStats(null);
                let bytesSent = 0;
                let ts = 0;
                stats.forEach(report => {
                    if (report.type === 'outbound-rtp' && report.kind === 'video' && !report.isRemote) {
                        bytesSent += report.bytesSent || 0;
                        ts = Math.max(ts, report.timestamp || 0);
                    }
                });
                if (prevTs && ts && bytesSent >= prevBytes) {
                    const dt = (ts - prevTs) / 1000; // seconds
                    if (dt > 0.5) {
                        const kbps = ((bytesSent - prevBytes) * 8) / 1000 / dt;
                        if (kbps < THRESHOLD_KBPS) {
                            weakStreaks += 1;
                            console.warn(`📉 Weak video link: ${kbps.toFixed(1)} kbps (streak ${weakStreaks})`);
                        } else {
                            weakStreaks = 0;
                        }
                        if (weakStreaks >= WEAK_STREAK_LIMIT) {
                            console.warn('⚠️ Auto-downgrading to High-Fidelity Audio Only');
                            stream.getVideoTracks().forEach(t => { t.enabled = false; });
                            // Stop the senders' video to free bandwidth.
                            pc.getSenders().forEach(sender => {
                                if (sender.track && sender.track.kind === 'video') {
                                    try { sender.track.enabled = false; } catch (_) { }
                                }
                            });
                            setVideoDowngraded(true);
                            setIsVideoOff(true);
                            sendSignal('downgrade', { reason: 'weak-link' }).catch(() => { });
                        }
                    }
                }
                prevBytes = bytesSent;
                prevTs = ts;
            } catch (err) {
                // Ignore transient stats errors
            }
        };

        statsMonitorRef.current = setInterval(tick, 3000);
        return () => {
            if (statsMonitorRef.current) {
                clearInterval(statsMonitorRef.current);
                statsMonitorRef.current = null;
            }
        };
    }, [isConnected, videoDowngraded, sendSignal]);

    // ───────────────────────────────────────────────────────────────────
    // Connection quality monitor — RTT, packet loss, bandwidth, jitter
    // ───────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isConnected) { setConnectionQuality('unknown'); return; }
        const pc = peerRef.current;
        if (!pc) return;

        const qualityInterval = setInterval(async () => {
            try {
                const stats = await pc.getStats(null);
                let rtt = 0, packetLoss = 0, bandwidth = 0, jitter = 0;
                let packetsReceived = 0, packetsLost = 0;

                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        rtt = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
                        bandwidth = report.availableOutgoingBitrate ? report.availableOutgoingBitrate / 1000 : 0;
                    }
                    if (report.type === 'inbound-rtp' && !report.isRemote) {
                        packetsReceived += report.packetsReceived || 0;
                        packetsLost += report.packetsLost || 0;
                        if (report.jitter) jitter = Math.max(jitter, report.jitter * 1000);
                    }
                });

                const total = packetsReceived + packetsLost;
                packetLoss = total > 0 ? (packetsLost / total) * 100 : 0;

                setQualityStats({ rtt: Math.round(rtt), packetLoss: parseFloat(packetLoss.toFixed(1)), bandwidth: Math.round(bandwidth), jitter: Math.round(jitter) });

                // Determine quality level
                if (rtt < 100 && packetLoss < 1 && bandwidth > 300) setConnectionQuality('excellent');
                else if (rtt < 250 && packetLoss < 3 && bandwidth > 150) setConnectionQuality('good');
                else if (rtt < 500 && packetLoss < 8) setConnectionQuality('poor');
                else setConnectionQuality('critical');
            } catch (_) { /* ignore stats errors */ }
        }, 3000);

        return () => clearInterval(qualityInterval);
    }, [isConnected]);

    // Screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
            screenStreamRef.current = screenStream;
            const pc = peerRef.current;
            if (!pc) return;

            const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (videoSender) {
                await videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
            }

            screenStream.getVideoTracks()[0].onended = () => stopScreenShare();
            setIsScreenSharing(true);
            sendSignal('screen-share', { active: true });
        } catch (err) {
            console.warn('[Call] Screen share failed:', err);
        }
    }, [sendSignal]);

    const stopScreenShare = useCallback(async () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        // Restore camera track
        const pc = peerRef.current;
        const stream = localStreamRef.current;
        if (pc && stream) {
            const videoTrack = stream.getVideoTracks()[0];
            const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (videoSender && videoTrack) {
                await videoSender.replaceTrack(videoTrack);
            }
        }
        setIsScreenSharing(false);
        sendSignal('screen-share', { active: false });
    }, [sendSignal]);

    // Send call reaction
    const sendReaction = useCallback((emoji) => {
        sendSignal('reaction', { emoji });
    }, [sendSignal]);

    // End call
    const endCall = useCallback(async () => {
        if (isConnected || isConnecting) {
            await sendSignal('end', {});
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
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
        setIsScreenSharing(false);
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
        videoDowngraded,
        isScreenSharing,
        connectionQuality,
        qualityStats,
        incomingReactions,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        sendReaction
    };
};
